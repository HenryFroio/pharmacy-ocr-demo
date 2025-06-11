import { FormInput } from './FormInput';
import { Plus, X } from 'lucide-react';

const formatPhoneNumber = (value) => {
  // Remove tudo que não for dígito
  const cleaned = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limited = cleaned.slice(0, 11);
  
  // Aplica a máscara
  if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 7) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  }
};

export const ExtractedDataForm = ({ data, onUpdate }) => {
  const handleInputChange = (field, value) => {
    // Ignora mudanças no campo orderId (Identificador do pedido)
    if (field === 'orderId') return;
    
    onUpdate({ ...data, [field]: value });
  };

  const handlePhoneChange = (value) => {
    const formattedPhone = formatPhoneNumber(value);
    handleInputChange('phone', formattedPhone);
  };

  const handleProductChange = (index, value) => {
    const updatedProducts = [...data.products];
    updatedProducts[index] = value;
    handleInputChange('products', updatedProducts);
  };

  const handleAddProduct = () => {
    handleInputChange('products', [...data.products, '']);
  };

  const handleRemoveProduct = (index) => {
    const updatedProducts = data.products.filter((_, i) => i !== index);
    handleInputChange('products', updatedProducts);
  };

  // Função nula para o campo de identificador de pedido
  const noChange = () => {};  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h3 className="font-bold text-lg mb-4">Dados Extraídos:</h3>
      
      <div className="space-y-4">
        <FormInput
          label="Cliente"
          value={data.clientName}
          onChange={(value) => handleInputChange('clientName', value)}
        />
        <FormInput
          label="Telefone"
          value={data.phone}
          onChange={handlePhoneChange}
          maxLength={15}
        />
        <FormInput
          label="Endereço"
          value={data.address}
          onChange={(value) => handleInputChange('address', value)}
        />
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Produtos:
            </label>
            <button
              onClick={handleAddProduct}
              className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg bg-[#e41c26] hover:bg-[#b81219] text-white transition-colors duration-300"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Produto</span>
            </button>
          </div>
          <div className="space-y-2">
            {data.products.map((product, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={product}
                  onChange={(e) => handleProductChange(index, e.target.value)}
                  placeholder="Nome do produto (quantidade)"
                  className="flex-1 p-2 border rounded focus:border-[#e41c26] focus:ring-1 focus:ring-[#e41c26] outline-none"
                />
                <button
                  onClick={() => handleRemoveProduct(index)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-300"
                  title="Remover produto"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>        <FormInput
          label="Valor Total"
          value={data.totalValue}
          onChange={(value) => handleInputChange('totalValue', value)}
        />
        
        {/* Campo opcional de localização do WhatsApp */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <FormInput
            label="Link de Localização WhatsApp (Opcional)"
            value={data.whatsappLocation || ''}
            onChange={(value) => handleInputChange('whatsappLocation', value)}
            placeholder="Ex: https://maps.app.goo.gl/..."
          />
          <p className="text-xs text-blue-600 mt-1">
            Este campo é opcional. Se preenchido, será usado como localização do pedido.
          </p>
        </div>
      </div>
    </div>
  );
};
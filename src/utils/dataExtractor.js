// src/utils/dataExtractor.js
export const extractRelevantData = (lines, existingData = null) => {
  const linesArray = lines.split('\n');

  const findValueAfterLabel = (label, lines) => {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(label)) {
        const afterLabel = lines[i].split(label)[1];
        if (afterLabel?.trim()) return afterLabel.trim();
        if (i + 1 < lines.length) return lines[i + 1].trim();
      }
    }
    return '';
  };

  const findOrderId = (lines) => {
    const startKeywords = [
      'Último orçamento deste terminal',
      'Último orçamento deste ter',
      'Último orçamento des',
      'Último orçamen',
      'Último orça'
    ];

    for (let i = 0; i < lines.length; i++) {
      // Verifica se a linha atual começa com alguma das palavras-chave
      if (startKeywords.some(keyword => lines[i].trim().startsWith('Último'))) {
        const nextLine = lines[i + 1]?.trim();
        
        if (nextLine && !isNaN(nextLine)) {
          return (parseInt(nextLine) + 1).toString();
        }
      }
    }
    return '';
  };

  const findClientName = (lines) => {
    // Lista de palavras-chave para ignorar
    const invalidKeywords = [
      'convênio', 'convenio',
      'conheça', 'conheca',
      'endereço', 'endereco',
      'dúvidas', 'duvidas',
      'cpf',
      'cartão', 'cartao',
      'base de conhecimento',
      '...'
    ].map(word => word.toLowerCase());

    // Função auxiliar para validar um possível nome
    const isValidName = (name) => {
      if (!name || name.length < 2) return false;
      
      // Converte para lowercase para comparação
      const lowerName = name.toLowerCase();
      
      // Verifica se contém alguma palavra-chave inválida
      if (invalidKeywords.some(keyword => lowerName.includes(keyword))) {
        return false;
      }

      // Permitir uma variedade maior de caracteres no nome
      // Incluindo hífens, parênteses, traços e outros caracteres especiais
      // Apenas rejeitamos caracteres altamente improváveis em nomes como %, $, @, etc.
      if (/[%$@&*#<>{}[\]\/\\|+=~`^]/.test(name)) {
        return false;
      }

      // Verificação adicional para evitar linhas com números demais (prováveis códigos ou telefones)
      const digitCount = (name.match(/\d/g) || []).length;
      if (digitCount > 4 || digitCount / name.length > 0.3) {
        return false;
      }

      return true;
    };

    // Primeiro método: procura especificamente após 'Nome do Cliente'
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Nome do Cliente')) {
        // Extrai diretamente da mesma linha, após "Nome do Cliente"
        const sameLine = lines[i].split('Nome do Cliente')[1]?.trim();
        if (sameLine && isValidName(sameLine)) {
          return sameLine;
        }
        
        // Se não encontrou na mesma linha ou não é válido, procura nas próximas linhas
        for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
          const possibleName = lines[j].trim();
          if (isValidName(possibleName)) {
            return possibleName;
          }
        }
      }
    }
    
    // Segundo método: tenta encontrar o nome entre '...'
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '...') {
        if (i + 2 < lines.length && 
            lines[i + 2].trim() === '...' && 
            lines[i + 1].trim() !== '...') {
          const possibleName = lines[i + 1].trim();
          if (isValidName(possibleName)) {
            return possibleName;
          }
        }
      }
    }
    
    return '';
  };

  const findPhone = (lines) => {
    for (let i = 0; i < lines.length; i++) {
      // Procura qualquer linha que contenha um padrão próximo de telefone
      const phonePattern = /[\[\({]?\d{2}[\]\)}]?\s*\d{4,5}[-\s]?\d{4}/;
      const match = lines[i].match(phonePattern);
      
      if (match) {
        let phone = match[0];
        
        // Remove todos os caracteres especiais exceto números
        const numbers = phone.replace(/\D/g, '');
        
        // Se temos exatamente 10 ou 11 dígitos (DDD + número)
        if (numbers.length === 10 || numbers.length === 11) {
          // Reformata o número no padrão correto
          const ddd = numbers.slice(0, 2);
          const part1 = numbers.slice(2, numbers.length === 11 ? 7 : 6);
          const part2 = numbers.slice(numbers.length === 11 ? 7 : 6);
          
          return `(${ddd}) ${part1}-${part2}`;
        }
      }
    }
    return '';
  };

  const findAddressAndCEP = (lines) => {
    let address = '';
    let cep = '';

    const isCEP = (text) => {
      // Match Brazilian CEP formats: 12.345-678 or 12345-678
      return text.match(/(?:\d{2}\.\d{3}-\d{3}|\d{5}-\d{3})/);
    };

    const isValidAddress = (text) => {
      // Lista de palavras-chave que indicam um endereço real
      const addressKeywords = [
        'rua',
        'quadra',
        'lote',
        'conjunto',
        'qd',
        'lt',
        'cj',
        'conj',
        'avenida',
        'av',
        'alameda',
        'travessa',
        'rod',
        'rodovia',
        'estrada',
        'praça',
        'via',
        'trecho', 
        'chácara', 
        'chacara',
        'casa',   
        'setor',  
        'núcleo', 
        'nucleo', 
        'área',   
        'area',   
        'bloco',  
        'apt',    
        'apartamento',
        'qnm',    
        'qnn',    
        'qnp',    
        'qnq',    
        'shis',   
        'shcs',   
        'paranoa',
        'brasilia',
        'nr',     // Número
        'df',     // Distrito Federal
        'go',     // Goiás
        'bairro'
      ];

      // Lista de palavras-chave que NÃO devem estar em um endereço
      const invalidKeywords = [
        'conheça',
        'base de conhecimento',
        'últimos 20 itens',
        'útimos 20 itens',
        'ultimos 20 itens',
        'utimos 20 itens',
        'ultimos',
        'utimos',
        'itens',
        'itens comprados',
        'dúvidas',
        'matriz'
      ];
      
      const textLower = text.toLowerCase();
      
      // Verifica se o texto contém alguma palavra inválida
      if (invalidKeywords.some(keyword => textLower.includes(keyword.toLowerCase()))) {
        return false;
      }
      
      // Verifica se o texto contém alguma palavra-chave de endereço
      return addressKeywords.some(keyword => textLower.includes(keyword.toLowerCase()));
    };

    // Primeiro procura após "Endereço de entrega"
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Endereço de entrega')) {
        // Busca nas próximas 3 linhas por um endereço válido
        for (let j = 1; j <= 3; j++) {
          if (i + j < lines.length) {
            // Limpa qualquer rótulo de 'CEP:' e texto após da linha de endereço
            const rawLine = lines[i + j]?.trim() || '';
            const possibleAddress = rawLine.replace(/CEP:.*$/i, '').trim();
            // Verifica se é um endereço válido e não é muito curto após limpeza
            if (possibleAddress && possibleAddress.length > 10 && isValidAddress(possibleAddress)) {
              address = possibleAddress;
              
              // Busca linhas adicionais do endereço (como complemento)
              if (i + j + 1 < lines.length) {
                const nextLine = lines[i + j + 1]?.trim();
                // Anexar complemento somente se for parte do endereço
                if (nextLine && nextLine.length > 3 && isValidAddress(nextLine)) {
                  address += ' ' + nextLine;
                }
              }
              break;
            }
          }
        }
      }
    }

    // Se ainda não encontrou um endereço, faz uma busca mais ampla
    if (!address) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim();
        
        // Verifica se a linha atual parece um endereço e tem pelo menos 20 caracteres
        // Endereços geralmente são textos longos
        if (line && line.length >= 20 && isValidAddress(line)) {
          address = line;
          break;
        }
      }
    }

    // Agora procura pelo CEP em todo o texto
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (line && line.includes('CEP:')) {
        // Primeiro procura o CEP após "CEP:" na mesma linha
        const afterCEP = line.split('CEP:')[1]?.trim();
        let cepMatch = afterCEP ? isCEP(afterCEP) : null;
        if (!cepMatch && i + 1 < lines.length) {
          // Se não encontrou na mesma linha, procura na próxima linha
          cepMatch = isCEP(lines[i + 1]);
        }
        if (cepMatch) {
          cep = cepMatch[0];
          break;
        }
      }
      // Se não encontrou com o formato "CEP:", procura pelo padrão de CEP
      const cepMatch = isCEP(line);
      if (cepMatch) {
        cep = cepMatch[0];
      }
    }

    return { address, cep };
  };

  const extractProducts = (lines) => {
    const products = new Map();
    let startProcessing = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Começa a processar após essa linha
      if (line.includes('CRM/CRO/CRV')) {
        startProcessing = true;
        continue;
      }

      // Se já começamos a processar e encontramos uma linha com código de 6 dígitos
      if (startProcessing && /^\d{6}/.test(line)) {
        // Extrai todo o texto após o código como nome do produto
        const productMatch = line.match(/^\d{6}\s+(.+)$/);
        if (productMatch) {
          const productName = productMatch[1].trim();
          
          // Verifica se o nome do produto não está vazio
          if (productName.length > 0) {
            // Procura quantidade nas próximas linhas
            let foundQuantity = false;
            for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
              const qtyLine = lines[j].trim();
              // Procura por números com até 3 casas decimais
              const qtyMatch = qtyLine.match(/^(\d+(?:,\d{1,3})?)$/);
              if (qtyMatch) {
                const quantity = parseFloat(qtyMatch[1].replace(',', '.'));
                // Verifica se a quantidade é válida (não é NaN)
                if (!isNaN(quantity) && quantity > 0) {
                  products.set(productName, quantity);
                  foundQuantity = true;
                  break;
                }
              }
            }
            
            // Se não encontrou quantidade, assume 1
            if (!foundQuantity) {
              products.set(productName, 1);
            }
          }
        }
      }
    }

    return Array.from(products).map(([name, qty]) => `${name} (${qty}x)`);
  };

  const extractTotalValue = (lines) => {
    let values = [];
    let foundTotalGeral = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Total Geral')) {
        foundTotalGeral = true;
        continue;
      }

      if (foundTotalGeral) {
        // Aceita valores com ponto de milhar: 1.234,56 ou 123,45
        const match = lines[i].match(/\d{1,3}(?:\.\d{3})*,\d{2}/);
        if (match) {
          values.push(match[0]);
        }
        // Se encontrou 3 valores, retorna o último (Total Geral)
        if (values.length === 3) {
          return values[2];
        }
      }
    }
    return '';
  };

  // Extrair endereço e CEP
  let { address, cep } = findAddressAndCEP(linesArray);

  // Remove any trailing 'CEP:' without value
  address = address.replace(/CEP:\s*$/i, '');
  // Only append CEP if it's not already included in the address
  const addressHasCep = cep && address.includes(cep);
  let fullAddress = address;
  if (cep && !addressHasCep) {
    fullAddress += ` CEP: ${cep}`;
  }

  // Clean up double periods, commas, and other punctuation
  fullAddress = fullAddress
    .replace(/\.{2,}/g, '.') // Replace multiple periods with a single one
    .replace(/,{2,}/g, ',')  // Replace multiple commas with a single one
    .replace(/\s+\./g, '.')  // Remove space before period
    .replace(/\s+,/g, ',')   // Remove space before comma
    .replace(/\s+:/g, ':');  // Remove space before colon

  // Extrair produtos da imagem atual
  const newProducts = extractProducts(linesArray);

  // Processar os produtos sem duplicatas
  let finalProducts = [];
  
  if (newProducts.length > 0) {
    // Se temos novos produtos, substitui completamente os antigos
    finalProducts = newProducts;
  } else if (existingData?.products) {
    // Se não encontramos novos produtos, mantemos os existentes
    finalProducts = existingData.products;
  }

  // Retorna o objeto com os dados extraídos
  return {
    clientName: findClientName(linesArray) || existingData?.clientName || '',
    phone: findPhone(linesArray) || existingData?.phone || '',
    address: fullAddress || existingData?.address || '',
    products: finalProducts,
    totalValue: extractTotalValue(linesArray) || existingData?.totalValue || '',
    orderId: findOrderId(linesArray) || existingData?.orderId || ''
  };
};
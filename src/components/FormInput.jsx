// src/components/FormInput.jsx
export const FormInput = ({ label, value, onChange, type = "text", maxLength }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}:
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          const pasteData = e.clipboardData.getData('text');
          onChange(pasteData);
          e.preventDefault(); // Prevent default to avoid double paste
        }}
        className="mt-1 w-full p-2 border rounded focus:border-[#e41c26] focus:ring-1 focus:ring-[#e41c26] outline-none"
        maxLength={maxLength}
      />
    </div>
  );
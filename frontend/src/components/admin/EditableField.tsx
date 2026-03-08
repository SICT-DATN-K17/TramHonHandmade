
'use client';

import { useState } from 'react';
import { Edit, Check, X } from 'lucide-react';

interface EditableFieldProps {
  as?: 'h1' | 'p' | 'div';
  initialValue: string | number;
  fieldName: string;
  onUpdate: (fieldName: string, newValue: string | number) => Promise<void>;
  inputType?: 'text' | 'number' | 'textarea' | 'select';
  selectOptions?: { value: string; label: string }[];
  displayFormatter?: (value: string | number) => string;
  className?: string;
  inputClassName?: string;
  style?: React.CSSProperties;
}

const EditableField = ({
  as: Component = 'div',
  initialValue,
  fieldName,
  onUpdate,
  inputType = 'text',
  selectOptions = [],
  displayFormatter,
  className = '',
  inputClassName = '',
  style,
}: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (value === initialValue) {
      setIsEditing(false);
      return;
    }
    setIsUpdating(true);
    try {
      await onUpdate(fieldName, value);
      setIsEditing(false);
    } catch (error) {
      // Lỗi đã được xử lý ở component cha
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  const renderInput = () => {
    const commonClasses = `bg-white border-yellow-400 focus:ring-yellow-500 focus:border-yellow-500 block w-full shadow-sm sm:text-sm border rounded-md p-1 ${inputClassName}`;
    
    if (inputType === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={commonClasses}
          rows={5}
          autoFocus
        />
      );
    }
    if (inputType === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={commonClasses}
          autoFocus
        >
          {selectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        type={inputType}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={commonClasses}
        autoFocus
      />
    );
  };

  if (isEditing) {
    return (
      <div className={`flex items-start space-x-2 ${className}`} style={style}>
        <div className="flex-grow">{renderInput()}</div>
        <div className="flex flex-col space-y-1">
          <button onClick={handleUpdate} disabled={isUpdating} className="p-1 text-green-600 hover:bg-green-100 rounded-full disabled:opacity-50" title="Lưu">
            <Check size={18} />
          </button>
          <button onClick={handleCancel} disabled={isUpdating} className="p-1 text-red-600 hover:bg-red-100 rounded-full disabled:opacity-50" title="Hủy">
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Component className={`group relative flex items-center space-x-2 min-h-[38px] ${className}`} style={style}>
      <span className="flex-grow break-words">
        {displayFormatter ? displayFormatter(value) : String(value)}
      </span>
      <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" title={`Chỉnh sửa`}>
        <Edit size={16} />
      </button>
    </Component>
  );
};

export default EditableField;

import React, { forwardRef, useState, useEffect } from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  validationRules?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    email?: boolean;
    phone?: boolean;
    postalCode?: boolean;
    number?: boolean;
    custom?: (value: string) => string | null;
  };
  showValidation?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    icon: Icon, 
    iconPosition = 'left', 
    fullWidth = false,
    className = '',
    validationRules,
    showValidation = true,
    value = '',
    onChange,
    onBlur,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = useState(value);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [isTouched, setIsTouched] = useState(false);

    // バリデーション関数
    const validateValue = (val: string): string | null => {
      if (!validationRules) return null;

      const stringValue = String(val);

      // 必須チェック
      if (validationRules.required && !stringValue.trim()) {
        return 'この項目は必須です';
      }

      // 空の場合は他のバリデーションをスキップ
      if (!stringValue.trim()) {
        return null;
      }

      // 最小文字数チェック
      if (validationRules.minLength && stringValue.length < validationRules.minLength) {
        return `${validationRules.minLength}文字以上で入力してください`;
      }

      // 最大文字数チェック
      if (validationRules.maxLength && stringValue.length > validationRules.maxLength) {
        return `${validationRules.maxLength}文字以下で入力してください`;
      }

      // メールアドレスチェック
      if (validationRules.email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(stringValue)) {
          return '正しいメールアドレスを入力してください';
        }
      }

      // 電話番号チェック（ハイフンなし）
      if (validationRules.phone) {
        const phonePattern = /^[0-9]{10,11}$/;
        if (!phonePattern.test(stringValue)) {
          return '正しい電話番号を入力してください（ハイフンなし、10-11桁）';
        }
      }

      // 郵便番号チェック
      if (validationRules.postalCode) {
        const postalPattern = /^[0-9]{7}$/;
        if (!postalPattern.test(stringValue)) {
          return '正しい郵便番号を入力してください（7桁）';
        }
      }

      // 数値チェック
      if (validationRules.number) {
        if (isNaN(Number(stringValue))) {
          return '数値を入力してください';
        }
      }

      // パターンチェック
      if (validationRules.pattern && !validationRules.pattern.test(stringValue)) {
        return '正しい形式で入力してください';
      }

      // カスタムバリデーション
      if (validationRules.custom) {
        const customError = validationRules.custom(stringValue);
        if (customError) {
          return customError;
        }
      }

      return null;
    };

    // リアルタイムバリデーション
    useEffect(() => {
      if (showValidation && isTouched) {
        const error = validateValue(String(internalValue));
        setValidationError(error);
        setIsValid(error === null && String(internalValue).trim() !== '');
      }
    }, [internalValue, validationRules, showValidation, isTouched]);

    // 外部からのvalue変更を反映
    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      setIsTouched(true);
      
      if (onChange) {
        onChange(e);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsTouched(true);
      
      if (onBlur) {
        onBlur(e);
      }
    };

    // エラー表示の優先順位：外部エラー > バリデーションエラー
    const displayError = error || (showValidation && isTouched ? validationError : null);
    const showSuccess = showValidation && isTouched && isValid && !error;

    const inputClasses = [
      'block w-full rounded-lg border px-3 py-2.5 text-sm',
      'placeholder-gray-400 shadow-sm transition-colors duration-200',
      'disabled:bg-gray-50 disabled:text-gray-500',
      displayError 
        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20' 
        : showSuccess
        ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-20'
        : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20',
      Icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '',
      showSuccess ? 'pr-10' : '',
      className,
    ].join(' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {validationRules?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className={`absolute inset-y-0 ${iconPosition === 'left' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <input
            ref={ref}
            className={inputClasses}
            value={internalValue}
            onChange={handleChange}
            onBlur={handleBlur}
            {...props}
          />
          {showSuccess && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          )}
          {displayError && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>
        {displayError && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
            {displayError}
          </p>
        )}
        {showSuccess && (
          <p className="mt-1 text-sm text-green-600 flex items-center">
            <CheckCircle className="w-4 h-4 mr-1 flex-shrink-0" />
            入力内容が正しいです
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
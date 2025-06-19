import React, { forwardRef, useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { validateEmail, EmailValidationResult } from '../../utils/emailValidation';

interface EmailInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  showValidation?: boolean;
  onValidationChange?: (result: EmailValidationResult) => void;
  onChange?: (value: string, validationResult: EmailValidationResult) => void;
}

export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ 
    label, 
    error, 
    fullWidth = false,
    className = '',
    showValidation = true,
    onValidationChange,
    onChange,
    value = '',
    onBlur,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = useState(String(value));
    const [validationResult, setValidationResult] = useState<EmailValidationResult>({
      isValid: false,
      normalizedEmail: ''
    });
    const [isTouched, setIsTouched] = useState(false);

    // バリデーション実行
    useEffect(() => {
      if (showValidation && isTouched && internalValue) {
        const result = validateEmail(internalValue);
        setValidationResult(result);
        
        if (onValidationChange) {
          onValidationChange(result);
        }
      } else if (!internalValue) {
        const emptyResult = { isValid: false, normalizedEmail: '' };
        setValidationResult(emptyResult);
        
        if (onValidationChange) {
          onValidationChange(emptyResult);
        }
      }
    }, [internalValue, showValidation, isTouched, onValidationChange]);

    // 外部からのvalue変更を反映
    useEffect(() => {
      setInternalValue(String(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      setIsTouched(true);
      
      if (onChange) {
        const result = validateEmail(newValue);
        onChange(newValue, result);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsTouched(true);
      
      if (onBlur) {
        onBlur(e);
      }
    };

    // エラー表示の優先順位：外部エラー > バリデーションエラー
    const displayError = error || (showValidation && isTouched && validationResult.error);
    const showSuccess = showValidation && isTouched && validationResult.isValid && !error;

    const inputClasses = [
      'block w-full rounded-lg border px-3 py-2.5 text-sm pl-10',
      'placeholder-gray-400 shadow-sm transition-colors duration-200',
      'disabled:bg-gray-50 disabled:text-gray-500',
      displayError 
        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20' 
        : showSuccess
        ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-20'
        : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20',
      showSuccess ? 'pr-10' : '',
      className,
    ].join(' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {/* メールアイコン */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          
          {/* 入力フィールド */}
          <input
            ref={ref}
            type="email"
            className={inputClasses}
            value={internalValue}
            onChange={handleChange}
            onBlur={handleBlur}
            {...props}
          />
          
          {/* 成功アイコン */}
          {showSuccess && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          )}
          
          {/* エラーアイコン */}
          {displayError && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>
        
        {/* エラーメッセージ */}
        {displayError && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
            {displayError}
          </p>
        )}
        
        {/* 成功メッセージ */}
        {showSuccess && (
          <p className="mt-1 text-sm text-green-600 flex items-center">
            <CheckCircle className="w-4 h-4 mr-1 flex-shrink-0" />
            正しいメールアドレスです
          </p>
        )}
        
        {/* 正規化されたメールアドレスの表示（デバッグ用） */}
        {showValidation && isTouched && validationResult.isValid && validationResult.normalizedEmail !== internalValue && (
          <p className="mt-1 text-xs text-blue-600">
            正規化後: {validationResult.normalizedEmail}
          </p>
        )}
      </div>
    );
  }
);

EmailInput.displayName = 'EmailInput';
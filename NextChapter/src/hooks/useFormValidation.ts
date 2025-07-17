import { useState, useCallback, useEffect } from 'react';
import { ValidationResult } from '../utils/validation';

export interface FormField<T = string> {
  value: T;
  error: string | null;
  touched: boolean;
}

export interface FormState {
  [key: string]: FormField;
}

export interface ValidationRules {
  [key: string]: (value: any, formState?: FormState) => ValidationResult;
}

export interface UseFormValidationOptions {
  initialValues: { [key: string]: any };
  validationRules: ValidationRules;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFormValidation({
  initialValues,
  validationRules,
  validateOnChange = true,
  validateOnBlur = true,
}: UseFormValidationOptions) {
  // Initialize form state
  const [formState, setFormState] = useState<FormState>(() => {
    const state: FormState = {};
    Object.keys(initialValues).forEach(key => {
      state[key] = {
        value: initialValues[key],
        error: null,
        touched: false,
      };
    });
    return state;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Validate a single field
  const validateField = useCallback((fieldName: string, value: any): string | null => {
    const rule = validationRules[fieldName];
    if (!rule) return null;

    const result = rule(value, formState);
    return result.isValid ? null : result.message || 'Invalid value';
  }, [validationRules, formState]);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    let isValid = true;
    const newState = { ...formState };

    Object.keys(formState).forEach(fieldName => {
      const error = validateField(fieldName, formState[fieldName].value);
      if (error) {
        isValid = false;
        newState[fieldName] = {
          ...newState[fieldName],
          error,
          touched: true,
        };
      }
    });

    setFormState(newState);
    return isValid;
  }, [formState, validateField]);

  // Handle field change
  const handleChange = useCallback((fieldName: string) => (value: any) => {
    setFormState(prev => {
      const newState = {
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          value,
          touched: true,
        },
      };

      // Validate on change if enabled
      if (validateOnChange && (prev[fieldName].touched || hasSubmitted)) {
        const error = validateField(fieldName, value);
        newState[fieldName].error = error;
      }

      return newState;
    });
  }, [validateOnChange, validateField, hasSubmitted]);

  // Handle field blur
  const handleBlur = useCallback((fieldName: string) => () => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        touched: true,
      },
    }));

    // Validate on blur if enabled
    if (validateOnBlur) {
      const error = validateField(fieldName, formState[fieldName].value);
      setFormState(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          error,
        },
      }));
    }
  }, [validateOnBlur, validateField, formState]);

  // Reset form
  const resetForm = useCallback(() => {
    const state: FormState = {};
    Object.keys(initialValues).forEach(key => {
      state[key] = {
        value: initialValues[key],
        error: null,
        touched: false,
      };
    });
    setFormState(state);
    setHasSubmitted(false);
    setIsSubmitting(false);
  }, [initialValues]);

  // Set field error manually
  const setFieldError = useCallback((fieldName: string, error: string | null) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error,
        touched: true,
      },
    }));
  }, []);

  // Set multiple field errors
  const setFieldErrors = useCallback((errors: { [key: string]: string }) => {
    setFormState(prev => {
      const newState = { ...prev };
      Object.keys(errors).forEach(fieldName => {
        if (newState[fieldName]) {
          newState[fieldName] = {
            ...newState[fieldName],
            error: errors[fieldName],
            touched: true,
          };
        }
      });
      return newState;
    });
  }, []);

  // Get field props for input components
  const getFieldProps = useCallback((fieldName: string) => {
    const field = formState[fieldName];
    return {
      value: field?.value || '',
      onChangeText: handleChange(fieldName),
      onBlur: handleBlur(fieldName),
      error: field?.error,
      touched: field?.touched,
    };
  }, [formState, handleChange, handleBlur]);

  // Handle form submission
  const handleSubmit = useCallback(async (onSubmit: (values: any) => Promise<void>) => {
    setHasSubmitted(true);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const values: { [key: string]: any } = {};
      Object.keys(formState).forEach(key => {
        values[key] = formState[key].value;
      });
      
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, formState]);

  // Check if form has any errors
  const hasErrors = Object.values(formState).some(field => field.error !== null);

  // Check if form has been modified
  const isDirty = Object.keys(formState).some(
    key => formState[key].value !== initialValues[key]
  );

  return {
    formState,
    isSubmitting,
    hasErrors,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    validateForm,
    validateField,
    resetForm,
    setFieldError,
    setFieldErrors,
    getFieldProps,
  };
}
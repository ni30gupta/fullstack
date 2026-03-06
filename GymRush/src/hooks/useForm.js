import { useState, useCallback } from 'react';

export function useForm(arg1 = {}, arg2) {
  // Support both signatures:
  // useForm({ initialValues, validationSchema })
  // useForm(initialValues, validationSchema)
  // default empty values; callers should pass their own via arguments
  let initialValues = {};
  let validationSchema = undefined;

  if (arg1 && (arg1.initialValues !== undefined || arg1.validationSchema !== undefined)) {
    initialValues = arg1.initialValues || {};
    validationSchema = arg1.validationSchema;
  } else {
    initialValues = arg1 || {};
    validationSchema = arg2;
  }

  const [values, setValues] = useState(initialValues || {});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setSubmitting] = useState(false);

  const validateField = useCallback(
    (name, value, vals) => {
      if (validationSchema && validationSchema[name]) {
        return validationSchema[name](value, vals || values);
      }
      return undefined;
    },
    [validationSchema, values]
  );

  const runValidation = useCallback((vals) => {
    if (!validationSchema) return {};
    const newErrors = {};
    Object.keys(validationSchema).forEach((key) => {
      const err = validationSchema[key](vals[key], vals);
      if (err) newErrors[key] = err;
    });
    return newErrors;
  }, [validationSchema]);

  const handleChange = useCallback(
    (name) => (value) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    (name) => () => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, values[name]);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [validateField, values]
  );

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitting(false);
  }, [initialValues]);

  const validateForm = useCallback(() => {
    const newErrors = runValidation(values);
    const valid = Object.keys(newErrors).length === 0;

    setErrors(newErrors);
    setTouched(
      Object.keys(validationSchema || {}).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    return valid;
  }, [runValidation, validationSchema, values]);

  const isValid = Object.keys(runValidation(values)).length === 0;

  const handleSubmit = useCallback(
    (fn) =>
      async (...args) => {
        const valid = validateForm();
        if (!valid) return { success: false, errors };
        setSubmitting(true);
        try {
          const res = await fn(...args);
          setSubmitting(false);
          return res;
        } catch (e) {
          setSubmitting(false);
          throw e;
        }
      },
    [validateForm, errors]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setFieldValue,
    setFieldError,
    setSubmitting,
    resetForm,
    validateForm,
  };
}

export default useForm;

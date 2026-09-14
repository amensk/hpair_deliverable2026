import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { signInUser, registerUser } from '../services/authService';
import { TextField } from './ui/Field';
import Button from './ui/Button';
import Alert from './ui/Alert';

const schema = (isLogin) =>
  Yup.object({
    email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters')
      .when([], { is: () => !isLogin, then: (s) => s.matches(/\d/, 'Include at least one number') }),
    confirm: isLogin
      ? Yup.string().strip()
      : Yup.string().oneOf([Yup.ref('password')], 'Passwords do not match').required('Confirm your password'),
  });

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (values, { setSubmitting }) => {
    setMessage(null);
    const fn = isLogin ? signInUser : registerUser;
    const result = await fn(values.email.trim(), values.password);
    if (!result.success) setMessage({ type: 'error', text: result.message });
    // On success the AuthProvider swaps this screen for the form.
    setSubmitting(false);
  };

  return (
    <div className="auth">
      <div className="stat-band stat-band--wide">
        <div><strong>42+</strong><span>Countries Represented</span></div>
        <div><strong>40,000+</strong><span>Past Delegates</span></div>
        <div><strong>500+</strong><span>Past Speakers</span></div>
      </div>

      <section className="auth__form container">
        <div className="auth__card card card--pad">
          <h2>{isLogin ? 'Sign in' : 'Create your account'}</h2>
          <p style={{ marginTop: 6, marginBottom: 24 }}>
            {isLogin ? 'Use the email and password you registered with.' : 'One account per delegate. You can sign back in any time.'}
          </p>

          {message && <Alert type={message.type}>{message.text}</Alert>}

          <Formik
            key={isLogin ? 'login' : 'register'}
            initialValues={{ email: '', password: '', confirm: '' }}
            validationSchema={schema(isLogin)}
            validateOnChange
            validateOnBlur
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, isValid, dirty }) => (
              <Form noValidate>
                <TextField name="email" label="Email address" type="email" autoComplete="email" placeholder="you@university.edu" autoFocus />
                <div className="field">
                  <TextField
                    name="password"
                    label="Password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    placeholder={isLogin ? 'Your password' : 'At least 6 characters, with a number'}
                  />
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    style={{ marginTop: -12, width: 'auto' }}
                    onClick={() => setShowPw((s) => !s)}
                    aria-pressed={showPw}
                  >
                    {showPw ? <FiEyeOff size={16} aria-hidden="true" /> : <FiEye size={16} aria-hidden="true" />}
                    <span>{showPw ? 'Hide password' : 'Show password'}</span>
                  </button>
                </div>
                {!isLogin && (
                  <TextField name="confirm" label="Confirm password" type={showPw ? 'text' : 'password'} autoComplete="new-password" />
                )}
                <Button type="submit" className="btn--block" loading={isSubmitting} disabled={!dirty || !isValid} iconRight={FiArrowRight}>
                  {isLogin ? 'Sign in' : 'Create account'}
                </Button>
              </Form>
            )}
          </Formik>

          <p className="auth__toggle">
            {isLogin ? "Don't have an account? " : 'Already registered? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin((v) => !v);
                setMessage(null);
              }}
            >
              {isLogin ? 'Create one' : 'Sign in instead'}
            </button>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Login;

import React, { useMemo, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { FiEye, FiEyeOff, FiArrowRight, FiArrowLeft, FiMail } from 'react-icons/fi';
import { signInUser, registerUser, resetPassword } from '../services/authService';
import { TextField } from './ui/Field';
import Button from './ui/Button';
import Alert from './ui/Alert';
import { useI18n } from '../i18n';

const schemaFor = (mode, t) => {
  const emailRule = Yup.string().trim().email(t('auth.v.emailInvalid')).required(t('auth.v.emailRequired'));
  if (mode === 'reset') return Yup.object({ email: emailRule });
  const isLogin = mode === 'login';
  return Yup.object({
    email: emailRule,
    password: Yup.string()
      .required(t('auth.v.passwordRequired'))
      .min(6, t('auth.v.passwordMin'))
      .when([], { is: () => !isLogin, then: (s) => s.matches(/\d/, t('auth.v.passwordNumber')) }),
    confirm: isLogin
      ? Yup.string().strip()
      : Yup.string().oneOf([Yup.ref('password')], t('auth.v.confirmMismatch')).required(t('auth.v.confirmRequired')),
  });
};

const Login = () => {
  const { t, lang } = useI18n();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'reset'
  const [showPw, setShowPw] = useState(false);
  const [message, setMessage] = useState(null); // { type, key }
  const [lastEmail, setLastEmail] = useState('');

  const schema = useMemo(() => schemaFor(mode, t), [mode, t]);

  const switchMode = (next) => {
    setMode(next);
    setMessage(null);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setMessage(null);
    const email = values.email.trim();
    setLastEmail(email);
    let result;
    if (mode === 'login') result = await signInUser(email, values.password);
    else if (mode === 'register') result = await registerUser(email, values.password);
    else result = await resetPassword(email);

    if (mode === 'reset') setMessage({ type: result.success ? 'success' : 'error', key: result.messageKey });
    else if (!result.success) setMessage({ type: 'error', key: result.messageKey });
    // On successful sign-in/register the AuthProvider swaps this screen for the form.
    setSubmitting(false);
  };

  const prefix = mode === 'login' ? 'auth.signIn' : mode === 'register' ? 'auth.register' : 'auth.reset';

  return (
    <div className="auth">
      <div className="stat-band stat-band--wide">
        <div><strong>42+</strong><span>{t('stats.countries')}</span></div>
        <div><strong>40,000+</strong><span>{t('stats.delegates')}</span></div>
        <div><strong>500+</strong><span>{t('stats.speakers')}</span></div>
      </div>

      <section className="auth__form container">
        <div className="auth__card card card--pad">
          {mode === 'reset' && (
            <button type="button" className="btn btn--ghost btn--sm" style={{ width: 'auto', marginBottom: 12, marginLeft: -12 }} onClick={() => switchMode('login')}>
              <FiArrowLeft size={16} aria-hidden="true" /> <span>{t('auth.backToSignIn')}</span>
            </button>
          )}
          <h2>{t(`${prefix}.title`)}</h2>
          <p style={{ marginTop: 6, marginBottom: 24 }}>{t(`${prefix}.sub`)}</p>

          {message && <Alert type={message.type}>{t(message.key)}</Alert>}

          <Formik
            key={`${mode}-${lang}`}
            initialValues={{ email: lastEmail, password: '', confirm: '' }}
            validationSchema={schema}
            validateOnChange
            validateOnBlur
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, isValid, dirty }) => (
              <Form noValidate>
                <TextField name="email" label={t('auth.email')} type="email" autoComplete="email" placeholder={t('auth.emailPlaceholder')} autoFocus />
                {mode !== 'reset' && (
                  <div className="field">
                    <TextField
                      name="password"
                      label={t('auth.password')}
                      type={showPw ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      placeholder={mode === 'login' ? t('auth.passwordPlaceholderLogin') : t('auth.passwordPlaceholderRegister')}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -12, flexWrap: 'wrap', gap: 8 }}>
                      <button type="button" className="btn btn--ghost btn--sm" style={{ width: 'auto' }} onClick={() => setShowPw((s) => !s)} aria-pressed={showPw}>
                        {showPw ? <FiEyeOff size={16} aria-hidden="true" /> : <FiEye size={16} aria-hidden="true" />}
                        <span>{showPw ? t('auth.hidePassword') : t('auth.showPassword')}</span>
                      </button>
                      {mode === 'login' && (
                        <button type="button" className="auth__link" onClick={() => switchMode('reset')}>
                          {t('auth.forgot')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {mode === 'register' && (
                  <TextField name="confirm" label={t('auth.confirm')} type={showPw ? 'text' : 'password'} autoComplete="new-password" />
                )}
                <Button
                  type="submit"
                  className="btn--block"
                  loading={isSubmitting}
                  disabled={(!dirty && !lastEmail) || !isValid}
                  iconRight={mode === 'reset' ? undefined : FiArrowRight}
                  icon={mode === 'reset' ? FiMail : undefined}
                >
                  {t(`${prefix}.cta`)}
                </Button>
              </Form>
            )}
          </Formik>

          {mode !== 'reset' && (
            <p className="auth__toggle">
              {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}
              <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? t('auth.createOne') : t('auth.signInInstead')}
              </button>
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Login;

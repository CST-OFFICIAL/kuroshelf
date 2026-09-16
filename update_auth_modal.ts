import fs from 'fs';

let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf-8');

// 1. Add countdown state and useEffect
const stateTarget = `const [showPassword, setShowPassword] = useState(false);`;
const stateReplacement = `const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);`;
content = content.replace(stateTarget, stateReplacement);

// 2. Update handleSendOtp
const sendOtpTarget = `  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setError('A valid email address is required.');
      return;
    }
    setLoading(true);
    try {
      const res = await sendEmailOtp(email.trim());
      if (res.success) {
        setTab('otp');
      } else {
        setError(res.error || 'Failed to send verification code');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };`;
const sendOtpReplacement = `  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countdown > 0) return;
    setError(null);
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setError('A valid email address is required.');
      return;
    }
    setLoading(true);
    try {
      const res = await sendEmailOtp(email.trim());
      if (res.success) {
        setTab('otp');
        setCountdown(60);
      } else {
        setError(res.error || 'Failed to send verification code');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };`;
content = content.replace(sendOtpTarget, sendOtpReplacement);

// 3. Update the Resend Button
const resendBtnTarget = `<button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  <span>Didn't receive the code? Resend</span>
                </button>`;
const resendBtnReplacement = `<button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || countdown > 0}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-neutral-400 hover:text-white transition-colors disabled:opacity-50 disabled:hover:text-neutral-500"
                >
                  <span>{countdown > 0 ? \`Resend code in \${countdown}s\` : "Didn't receive the code? Resend"}</span>
                </button>`;
content = content.replace(resendBtnTarget, resendBtnReplacement);

fs.writeFileSync('src/components/AuthModal.tsx', content);
console.log("Updated AuthModal.tsx");

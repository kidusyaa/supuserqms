"use client";

import React, { useState } from 'react';
import { auth } from '@/lib/firebase-simple';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

// Helper to set up reCAPTCHA
const setupRecaptcha = () => {
  // Ensure the window object is available
  if (typeof window !== 'undefined') {
    // Make sure the verifier is only created once
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          console.log("reCAPTCHA verified");
        }
      });
    }
    return window.recaptchaVerifier;
  }
  return null;
};

export function PhoneNumberLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    const recaptchaVerifier = setupRecaptcha();
    if (!recaptchaVerifier) {
        setError('reCAPTCHA could not be initialized.');
        setLoading(false);
        return;
    }

    try {
      const result = await signInWithPhoneNumber(auth, `+${phoneNumber}`, recaptchaVerifier);
      setConfirmationResult(result);
    } catch (err: any) {
      setError(err.message);
      // It's important to reset the reCAPTCHA if it fails
      if(window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId) => {
            grecaptcha.reset(widgetId);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult) return;
    setError('');
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      // User is now signed in! The AuthProvider will handle the redirect/UI change.
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* This container is where the reCAPTCHA widget will render */}
      <div id="recaptcha-container"></div>
      
      {!confirmationResult ? (
        <div>
          <h2>Enter Phone Number</h2>
          <p>Please include country code (e.g., 91xxxxxxxxxx for India)</p>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g. 1234567890"
          />
          <button onClick={handleSendOtp} disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </div>
      ) : (
        <div>
          <h2>Enter OTP</h2>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit code"
          />
          <button onClick={handleVerifyOtp} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

// You might need to add this to your global types or a declarations file
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}
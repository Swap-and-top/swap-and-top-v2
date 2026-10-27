'use client';

/**
 * The sign up page itself. See page.tsx.
 *
 * To the first app's sign up, in three steps on one page, shown along the
 * top of the card: the card on the left and, from tablet up, the 3D picture
 * on the right under "Create a new / Swap & Top / account".
 *
 * 1. Your details: first name, surname and email. "Next".
 * 2. Password: neighbourhood and city or town side by side, then the
 *    password twice. "Create account" makes the account (POST
 *    /api/auth/signup), its email not yet verified.
 * 3. Verify email: the code (a mock one until email is set up, see
 *    VerifyEmail). Verified, they are signed in and carry on.
 *
 * That is all it takes to browse and save. A verified phone comes later, in
 * Settings or the first time they post or make an offer, as for anyone who
 * joins with Google or Facebook.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { DEFAULT_TOWN, TOWNS, type Town } from '@snt/core';
import { Button, Dropdown, Spinner, StepBar, startPageLoad, type Step } from '@snt/ui';
import { AuthLayout } from '../signin/AuthLayout';
import { VerifyEmailStep } from '../signin/VerifyEmail';
import { EyeClosed, EyeOpen } from '../signin/SignInPage';
import styles from '../signin/SignInPage.module.css';

const STEPS: Step[] = [{ label: 'Your details' }, { label: 'Password' }, { label: 'Verify email' }];

const TOWN_OPTIONS = TOWNS.map((town) => ({ value: town, label: town }));
const looksLikeEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function SignUpPage({ next }: { next: string }) {
  const router = useRouter();
  const townLabel = useId();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('');
  const [town, setTown] = useState<Town>(DEFAULT_TOWN);
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const detailsReady =
    firstName.trim() !== '' && surname.trim() !== '' && looksLikeEmail(email.trim());

  function toStepTwo() {
    if (!firstName.trim() || !surname.trim() || !email.trim()) {
      toast.error('Enter your first name, surname and email.');
      return;
    }
    if (!looksLikeEmail(email.trim())) {
      toast.error('Check the email, it does not look right.');
      return;
    }
    setStep(2);
  }

  async function createAccount() {
    if (!area.trim()) {
      toast.error('Enter your neighbourhood.');
      return;
    }
    if (password.length < 8) {
      toast.error('Choose a longer password, at least 8 characters.');
      return;
    }
    if (again !== password) {
      toast.error('The two passwords do not match.');
      return;
    }
    setBusy(true);
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: firstName.trim(),
        surname: surname.trim(),
        email: email.trim(),
        password,
        location: `${area.trim()}, ${town}`,
      }),
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      const body = (await response?.json().catch(() => ({}))) as { error?: string } | undefined;
      toast.error(body?.error ?? 'We could not make the account. Try again in a minute.');
      return;
    }
    setStep(3);
  }

  function finish() {
    toast.success('Account created');
    startPageLoad();
    router.push(next);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (step === 1) toStepTwo();
    else if (step === 2) void createAccount();
  }

  return (
    <AuthLayout
      flipped
      tall
      lines={step === 3 ? ['Please verify', 'Swap & Top', 'account'] : ['Create a new', 'Swap & Top', 'account']}
      picture={
        step === 3
          ? { hero: '/signin/mail-hero.png', icon: '/signin/plane.png', wideIcon: true, smallHero: true }
          : { hero: '/signin/signup-hero.png', icon: '/signin/signup.png' }
      }
      onSubmit={submit}
    >
      {step < 3 ? <h1 className={styles.heading}>Create new account</h1> : null}
      <StepBar steps={STEPS} current={step} className={styles.stepBar} />

      {step === 3 ? (
        <VerifyEmailStep email={email.trim()} password={password} onDone={finish} />
      ) : step === 1 ? (
        <>
          <label className={styles.field}>
            <span className={styles.label}>First name</span>
            <span className={styles.box}>
              <input
                className={styles.input}
                autoComplete="given-name"
                placeholder="e.g. Tarisai"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </span>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Surname</span>
            <span className={styles.box}>
              <input
                className={styles.input}
                autoComplete="family-name"
                placeholder="e.g. Moyo"
                value={surname}
                onChange={(event) => setSurname(event.target.value)}
              />
            </span>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <span className={styles.box}>
              <input
                className={styles.input}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="e.g. johndoe@gmail.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </span>
          </label>
          <p className={styles.note}>
            Others see only your first name and the first letter of your surname.
          </p>

          {/* Ready once there is a first name, a surname and an email that
              looks like one. */}
          <button type="submit" className={styles.signIn} disabled={!detailsReady}>
            Next
          </button>
        </>
      ) : (
        <>
          <div className={styles.pair}>
            <label className={styles.field}>
              <span className={styles.label}>Neighbourhood</span>
              <span className={styles.box}>
                <input
                  className={styles.input}
                  autoComplete="address-level3"
                  placeholder="e.g. Mbare"
                  autoFocus
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                />
              </span>
            </label>
            <div className={styles.field}>
              <span id={townLabel} className={styles.label}>
                City or town
              </span>
              <Dropdown
                value={town}
                options={TOWN_OPTIONS}
                onChange={setTown}
                labelledBy={townLabel}
              />
            </div>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <span className={styles.box}>
              <input
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className={styles.eye}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((shown) => !shown)}
              >
                {showPassword ? <EyeClosed /> : <EyeOpen />}
              </button>
            </span>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Confirm password</span>
            <span className={styles.box}>
              <input
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter it again"
                value={again}
                onChange={(event) => setAgain(event.target.value)}
              />
            </span>
          </label>
          <p className={styles.note} />

          <button
            type="submit"
            className={styles.signIn}
            disabled={busy}
            aria-busy={busy || undefined}
          >
            {busy ? <Spinner size={20} label="Creating your account" /> : 'Create account'}
          </button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            block
            className={styles.back}
            onClick={() => setStep(1)}
          >
            Back
          </Button>
          <p className={styles.small}>
            By creating an account you agree to Swap &amp; Top’s{' '}
            <Link href="/terms" target="_blank">
              terms of use
            </Link>
            .
          </p>
        </>
      )}

      {step < 3 ? (
        <p className={styles.join}>
          Already have an account?{' '}
          <Link
            href={next === '/' ? '/signin' : `/signin?next=${encodeURIComponent(next)}`}
            className={styles.joinLink}
          >
            Sign in
          </Link>
        </p>
      ) : null}
    </AuthLayout>
  );
}

import { useCallback, useState } from 'react';
import { NextPageContext } from 'next';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { getAuth } from '@clerk/nextjs/server';
import { useRouter } from 'next/router';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';
import toast from 'react-hot-toast';

import Input from '@/components/Input';
import Head from 'next/head';
import ArrowLeftIcon from '@heroicons/react/24/solid/ArrowLeftIcon';

export async function getServerSideProps(context: NextPageContext) {
  const { userId } = getAuth(context.req as any);

  if (userId) {
    return {
      redirect: {
        destination: '/profiles',
        permanent: false,
      }
    }
  }

  return {
    props: {}
  }
}

const Auth = () => {
  const router = useRouter();

  // Login fields
  const [emailOrUsername, setEmailOrUsername] = useState('');

  // Register fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');

  // Shared field
  const [password, setPassword] = useState('');

  const [variant, setVariant] = useState('login');

  const toggleVariant = useCallback(() => {
    setVariant((currentVariant) => currentVariant === 'login' ? 'register' : 'login');
    // Clear fields when switching
    setEmail('');
    setEmailOrUsername('');
    setUsername('');
    setName('');
    setPassword('');
  }, []);

  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();

  const login = useCallback(async () => {
    try {
      if (!isSignInLoaded) return;

      // Validate required fields
      if (!password) {
        toast.error('Password is required');
        return;
      }

      const identifier = emailOrUsername.trim();
      if (!identifier) {
        toast.error('Email or username is required');
        return;
      }

      const loadingToast = toast.loading('Signing in...');

      const result = await signIn.create({
        identifier,
        password
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        toast.success('Welcome back!', { id: loadingToast });
        router.push('/profiles');
      } else {
        toast.error('Sign in failed. Please check your credentials.', { id: loadingToast });
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // Better error messages
      let errorMessage = 'Invalid credentials. Please try again.';

      if (error?.errors?.[0]) {
        const clerkError = error.errors[0];
        if (clerkError.code === 'form_identifier_not_found') {
          errorMessage = 'No account found with this email or username.';
        } else if (clerkError.code === 'form_password_incorrect') {
          errorMessage = 'Incorrect password. Please try again.';
        } else if (clerkError.message) {
          errorMessage = clerkError.message;
        }
      }

      toast.error(errorMessage);
    }
  }, [emailOrUsername, password, router, signIn, isSignInLoaded, setActive]);

  const register = useCallback(async () => {
    try {
      if (!isSignUpLoaded) return;

      // Validate required fields
      if (!name?.trim()) {
        toast.error('Full name is required');
        return;
      }

      if (!email || !password) {
        toast.error('Email and password are required');
        return;
      }

      if (password.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        toast.error('Please enter a valid email address');
        return;
      }

      const loadingToast = toast.loading('Creating your account...');

      const signUpData: any = {
        emailAddress: email.trim(),
        password
      };

      // Add name (required)
      const nameParts = name.trim().split(' ');
      signUpData.firstName = nameParts[0];
      if (nameParts.length > 1) {
        signUpData.lastName = nameParts.slice(1).join(' ');
      }

      // Add username if provided (optional)
      if (username?.trim()) {
        signUpData.username = username.trim();
      }

      const result = await signUp.create(signUpData);

      // Handle different signup statuses
      if (result.status === 'complete') {
        await setActiveSignUp({ session: result.createdSessionId });
        toast.success('Account created successfully!', { id: loadingToast });
        router.push('/profiles');
      } else if (result.status === 'missing_requirements') {
        // Email verification required
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        toast.success('Verification code sent to your email', { id: loadingToast });

        // Prompt user for verification code
        const code = prompt('Please enter the verification code sent to your email:');

        if (code) {
          try {
            const verifyToast = toast.loading('Verifying...');
            const verifyResult = await signUp.attemptEmailAddressVerification({
              code: code.trim()
            });

            if (verifyResult.status === 'complete') {
              await setActiveSignUp({ session: verifyResult.createdSessionId });
              toast.success('Email verified!', { id: verifyToast });
              router.push('/profiles');
            } else {
              toast.error('Verification incomplete. Please try again.', { id: verifyToast });
            }
          } catch (verifyError: any) {
            console.error('Verification error:', verifyError);
            toast.error('Invalid verification code. Please try again.');
          }
        }
      } else {
        console.log('Sign up status:', result.status);
        toast.info('Please check your email for verification.', { id: loadingToast });
      }
    } catch (error: any) {
      console.error('Registration error:', error);

      // Better error messages
      let errorMessage = 'Registration failed. Please try again.';

      if (error?.errors?.[0]) {
        const clerkError = error.errors[0];
        if (clerkError.code === 'form_identifier_exists') {
          errorMessage = 'An account with this email already exists.';
        } else if (clerkError.code === 'form_password_pwned') {
          errorMessage = 'This password has been found in a data breach. Please choose a different password.';
        } else if (clerkError.code === 'form_param_format_invalid') {
          errorMessage = 'Invalid email format. Please check your email address.';
        } else if (clerkError.code === 'form_username_invalid') {
          errorMessage = 'Invalid username. Use only letters, numbers, and underscores.';
        } else if (clerkError.message) {
          errorMessage = clerkError.message;
        }
      }

      toast.error(errorMessage);
    }
  }, [email, username, name, password, signUp, isSignUpLoaded, router, setActiveSignUp]);

  const signInWithGoogle = useCallback(async () => {
    try {
      if (!isSignInLoaded) return;
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/profiles'
      });
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error(error?.errors?.[0]?.message || 'Google sign in failed');
    }
  }, [signIn, isSignInLoaded]);

  const signInWithApple = useCallback(async () => {
    try {
      if (!isSignInLoaded) return;
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_apple',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/profiles'
      });
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      toast.error(error?.errors?.[0]?.message || 'Apple sign in failed');
    }
  }, [signIn, isSignInLoaded]);

  return (
    <div className="relative h-full bg-black w-full max-md:bg-[url('/images/mobile_view1.png')] bg-[url('/images/hero.jpg')] bg-no-repeat bg-center bg-fixed bg-cover">
      <Head>
        <title>StreamBox - Login or Register</title>
      </Head>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.7)_80%)]">
        <div className="bg-black w-full h-full bg-opacity-50">
          <nav className="px-12 py-5 flex justify-center items-center relative">
            <ArrowLeftIcon
              onClick={() => router.push('/home')}
              className="w-4 md:w-8 text-white cursor-pointer hover:opacity-80 transition absolute left-4"
            />
            <div className="scale-150 flex justify-center text-center content-center items-center">
              <img src="/images/favicon1.png" className="h-10 w-10" alt="Logo" />
              <p className='text-white font-semibold justify-center text-center pl-2 items-center content-center font-[Poppins]'>
                Stream<span className="text-blue-500/80">Box</span>
              </p>
            </div>
          </nav>
          <div className="flex justify-center">
            <div className="bg-black bg-opacity-70 px-16 py-16 self-center mt-2 lg:w-2/5 lg:max-w-md rounded-md w-4/5">
              <h2 className="text-white text-4xl mb-8 font-semibold">
                {variant === 'login' ? 'Sign in' : 'Register'}
              </h2>
              <div className="flex flex-col gap-4">
                {variant === 'login' ? (
                  <>
                    {/* Login Form - 2 fields only */}
                    <Input
                      id="emailOrUsername"
                      type="text"
                      label="Email or Username"
                      value={emailOrUsername}
                      onChange={(e: any) => setEmailOrUsername(e.target.value)}
                    />
                    <Input
                      type="password"
                      id="password"
                      label="Password"
                      value={password}
                      onChange={(e: any) => setPassword(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    {/* Register Form */}
                    <Input
                      id="name"
                      type="text"
                      label="Full Name *"
                      value={name}
                      onChange={(e: any) => setName(e.target.value)}
                    />
                    <Input
                      id="username"
                      type="text"
                      label="Username (Optional)"
                      value={username}
                      onChange={(e: any) => setUsername(e.target.value)}
                    />
                    <Input
                      id="email"
                      type="email"
                      label="Email *"
                      value={email}
                      onChange={(e: any) => setEmail(e.target.value)}
                    />
                    <Input
                      type="password"
                      id="password"
                      label="Password *"
                      value={password}
                      onChange={(e: any) => setPassword(e.target.value)}
                    />
                    <p className="text-neutral-400 text-xs -mt-2">
                      Password must be at least 8 characters long
                    </p>
                  </>
                )}
              </div>
              <button onClick={variant === 'login' ? login : register} className="bg-blue-900 py-3 text-white rounded-md w-full mt-10 hover:bg-blue-900/85 transition">
                {variant === 'login' ? 'Login' : 'Sign up'}
              </button>
              <div className="flex flex-row items-center gap-4 mt-8 justify-center">
                <div onClick={signInWithGoogle} className="w-10 h-10 bg-white rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition">
                  <FcGoogle size={32} />
                </div>
                <div onClick={signInWithApple} className="w-10 h-10 bg-black rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition">
                  <FaApple size={32} className="text-white" />
                </div>
              </div>
              <p className="text-neutral-500 mt-12 text-center">
                {variant === 'login' ? 'First time using StreamBox?' : 'Already have an account?'}
                <span onClick={toggleVariant} className="text-white ml-1 hover:underline cursor-pointer">
                  {variant === 'login' ? 'Create an account' : 'Login'}
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;

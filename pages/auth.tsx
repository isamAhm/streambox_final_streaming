import { useCallback, useState } from 'react';
import { NextPageContext } from 'next';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { getAuth } from '@clerk/nextjs/server';
import { useRouter } from 'next/router';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

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

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const [variant, setVariant] = useState('login');

  const toggleVariant = useCallback(() => {
    setVariant((currentVariant) => currentVariant === 'login' ? 'register' : 'login');
  }, []);

  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();

  const login = useCallback(async () => {
    try {
      if (!isSignInLoaded) return;

      // Validate required fields
      if (!password) {
        alert('Password is required');
        return;
      }

      const identifier = email.trim() || username.trim();
      if (!identifier) {
        alert('Email or username is required');
        return;
      }

      const result = await signIn.create({
        identifier,
        password
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/profiles');
      } else {
        console.error('Sign in incomplete:', result);
        alert('Sign in failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.errors?.[0]?.message || error?.errors?.[0]?.longMessage || 'Invalid credentials';
      alert(errorMessage);
    }
  }, [username, email, password, router, signIn, isSignInLoaded, setActive]);

  const register = useCallback(async () => {
    try {
      if (!isSignUpLoaded) return;

      // Validate required fields
      if (!email || !password) {
        alert('Email and password are required');
        return;
      }

      if (password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
      }

      const signUpData: any = {
        emailAddress: email.trim(),
        password
      };

      if (username?.trim()) {
        signUpData.username = username.trim();
      }

      if (name?.trim()) {
        const nameParts = name.trim().split(' ');
        signUpData.firstName = nameParts[0];
        if (nameParts.length > 1) {
          signUpData.lastName = nameParts.slice(1).join(' ');
        }
      }

      const result = await signUp.create(signUpData);

      if (result.status === 'complete') {
        await setActiveSignUp({ session: result.createdSessionId });
        router.push('/profiles');
      } else if (result.status === 'missing_requirements') {
        // Handle email verification
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        alert('Please check your email for a verification code.');
      } else {
        console.log('Sign up status:', result.status);
        alert('Registration incomplete. Please check your email for verification.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error?.errors?.[0]?.message || error?.errors?.[0]?.longMessage || 'Registration failed';
      alert(errorMessage);
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
      alert(error?.errors?.[0]?.message || 'Google sign in failed');
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
      alert(error?.errors?.[0]?.message || 'Apple sign in failed');
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
                {variant === 'register' && (
                  <Input
                    id="name"
                    type="text"
                    label="Full Name"
                    value={name}
                    onChange={(e: any) => setName(e.target.value)}
                  />
                )}
                <Input
                  id="username"
                  type="text"
                  label="Username"
                  value={username}
                  onChange={(e: any) => setUsername(e.target.value)}
                />
                <Input
                  id="email"
                  type="email"
                  label="Email address"
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                />
                <Input
                  type="password"
                  id="password"
                  label="Password"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                />
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

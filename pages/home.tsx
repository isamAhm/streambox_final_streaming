import { FadeIn } from '@/components/animated-elements'
import { TrendingSection } from '@/components/trending-section'
import { motion } from 'framer-motion'
import Head from 'next/head'
import router from 'next/router'
import React, { useState } from 'react'
import { Search, X, Menu, ArrowRight, Facebook, Instagram, Mail, Twitter, Youtube, Play } from 'lucide-react'
import { Button } from '@/components/button'

function home() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
  return (
    <section className="h-screen relative overflow-auto wave bg-black text-white scrollbar-transparent">
      <Head>
        <title>Welcome to StreamBox</title>
      </Head>
    <div className="flex justify-center">
      <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="justify-center md:flex fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-black/80 backdrop-blur-md py-3" 
          >
            <div className="container px-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center">
                <div
                  onClick={() => {
                    const pricingSection = document.getElementById('#');
                    if (pricingSection) {
                      pricingSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                 className="flex justify-center content-center cursor-pointer items-center">
                  <img src="/images/favicon1.png" className="h-10 w-10" alt="logo" />
                  <p className="pl-2 font-semibold justify-center content-center items-center">StreamBox</p>
                </div>
                
                <nav className="hidden md:flex ml-10 space-x-8">
                  <a href="#" className="text-white/80 hover:text-white transition-colors">Home</a>
                  <a href="#pricing" className="text-white/80 hover:text-white transition-colors">Pricing</a>
                  
                </nav>
              </div>
              
              <div className="hidden md:flex items-center space-x-4">
                <button title='search' className="text-white/80 hover:text-white p-2">
                  <Search className="w-5 h-5" />
                </button>
                <Button onClick={() => router.push('/auth')} variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white">
                  Sign In
                </Button>
                <Button onClick={() => router.push('/auth')} className="bg-blue-700 hover:bg-blue-700/90 text-white">
                  Sign Up
                </Button>
              </div>
              
              {/* Mobile menu button */}
              <button 
                className="md:hidden text-white p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
            
            {/* Mobile menu */}
            <div className={`md:hidden ${isMenuOpen ? "block" : "hidden"}`}>
              <div className="py-4 px-7 bg-stream-black/95 backdrop-blur-md">
                <nav className="flex flex-col space-y-4">
                    <a href="#" className="text-white/80 hover:text-white transition-colors py-2">Home</a>
                  <a href="#pricing" className="text-white/80 hover:text-white transition-colors py-2">Pricing</a>
                  
                </nav>
                <div className="mt-6 flex flex-col space-y-3">
                  <Button onClick={() => router.push('/auth')} className="border-white/20 bg-white/5 hover:bg-white/10 text-white w-full">
                    Sign In
                  </Button>
                  <Button onClick={() => router.push('/auth')} className="bg-blue-700 hover:bg-blue-700/90 text-white w-full">
                    Sign Up
                  </Button>
                </div>
              </div>
            </div>
          </motion.header>
    </div>
    <div id='#' className="max-md:mt-0 mt-24">
      
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 bg-[url('/images/hero.jpg')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-blue-900"></div>
      </div>
      
      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 20 }).map((_, index) => (
        <div 
          key={index}
          className="absolute rounded-full bg-white/40 animate-float-pulse"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}
    </div>
      
      {/* Content */}
      <div className="container relative z-10 px-4 sm:px-6 text-center">
        <FadeIn delay={0.3}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-gradient">
            Unlimited Movies, Shows, <br className="hidden md:block" /> and More
          </h1>
        </FadeIn>
        
        <FadeIn delay={0.5}>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Stream anywhere. Cancel anytime. Join millions of viewers enjoying the latest 
            blockbusters and bingeworthy series.
          </p>
        </FadeIn>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            
              <Button onClick={() => router.push('/auth')} className="bg-blue-700 hover:bg-blue-700/90 text-white px-8 py-6 text-lg rounded-full">
                <Play className="mr-2 h-5 w-5" />
                Start Watching Now
              </Button>
            
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              onClick={() => {
                const pricingSection = document.getElementById('pricing');
                if (pricingSection) {
                  pricingSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 py-6 text-lg rounded-full glass"
            >
              Explore Plans
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
    <section className="hero2 bg-black py-12 flex relative max-sm:px-4 px-14 z-10">
      <div className="flex relative justify-center items-start glass-card w-full max-md:grid max-md:grid-cols-1 glass pb-0 p-4 rounded-2xl shadow-lg shadow-blue-700">
        <div className="w-full md:w-1/2 max-w-[760px] pb-8">
          <h2 className="text-5xl max-sm:text-2xl font-bold mb-4">
            Your Gateway to Unlimited Entertainment
          </h2>
          <p className="text-2xl max-sm:text-lg mb-8 text-white">
            The ultimate hub for movie and series enthusiasts. Explore a
            diverse collection of titles, complete with in-depth descriptions
            and user ratings.
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="flex glass-hero text-white px-4 py-2 rounded-full hover:scale-95 hover:ease-in-out hover:duration-500 font-semibold border text-xl hover:bg-blue-700 hover:border-blue-600/80 "
          >
            <Play className="mr-2" />
            Stream Now
          </button>
        </div>
        <div className="w-1/2 block max-md:w-full flex-shrink-0">
          <img
            className="rounded-lg object-cover h-auto w-full mx-auto max-h-[400px] mb-4 hover:shadow-md "
            src="/images/inception.jpg"
            alt="Movie scene"
          />
        </div>
      </div>
    </section>
{/* Animated star fragments */}
<div className="relative h-48 -mt-10 -mb-12 overflow-hidden z-20">
  <div className="absolute inset-0 pointer-events-none">
    {Array.from({ length: 25 }).map((_, index) => {
      const size = Math.random() * 4 + 2;
      const opacity = Math.random() * 0.5 + 0.3;
      const duration = Math.random() * 3 + 2;
      const delay = Math.random() * 5;
      
      return (
        <div
          key={index}
          className="absolute bg-blue-600/80 rounded-full animate-star-glow hover:!opacity-100 transition-opacity"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: opacity,
            filter: `drop-shadow(0 0 ${size}px rgba(255,255,255,${opacity}))`,
            animation: `star-glow ${duration}s ease-in-out ${delay}s infinite`,
            transformOrigin: 'center',
          }}
        />
      );
    })}
  </div>
</div>

{/* Before services section */}
      <div className="mt-24">
      <section className="services py-12 mb-8">
        <div className="container max-md:px-4 mx-auto">
          <h2 className="text-4xl font-bold text-center mb-10">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="service-1 bg-black rounded-lg shadow-lg text-center">
              <img
                src="/images/rating_2.jpg"
                alt="Service 1"
                className="mx-auto rounded-xl"
              />
              <h3 className="text-2xl font-bold">Entertainment Ratings</h3>
            </div>

            <div className="service-2 bg-black rounded-lg shadow-lg text-center">
              <img
                src="/images/streaming_1.jpg"
                alt="Service 2"
                className="mx-auto rounded-xl"
              />
              <h3 className="text-2xl font-bold">Entertainment Streaming</h3>
            </div>

            <div className="service-3 bg-black rounded-lg shadow-lg text-center">
              <img
                src="/images/camera.jpg"
                alt="Service 3"
                className="mx-auto rounded-xl"
              />
              <h3 className="text-2xl font-bold">Offline Entertainment</h3>
            </div>
          </div>
        </div>
      </section>
      <div className='justify-center flex'>
        <TrendingSection/>
      </div>
      <section
        className="logos px-16 whitespace-nowrap relative box-border bg-slate-500 z-20 overflow-hidden"
      >
        <div className="logos-slide">
              {[...Array(2)].map((_, i) => (
            <React.Fragment key={i}>
              <img className="h-24 mx-10" src="/images/netflix.ico" alt="netflix logo" />
              <img className="h-24 mx-10" src="/images/hbo.ico" alt="hbo logo" />
              <img className="h-24 mx-10" src="/images/disney.ico" alt="disney logo" />
              <img className="h-24 mx-10" src="/images/prime.ico" alt="prime logo" />
              <img className="h-24 mx-10" src="/images/hulu.ico" alt="hulu logo" />
              <img className="h-24 mx-10" src="/images/appletv.ico" alt="appletv logo" />
              <img className="h-24 mx-10" src="/images/Paramount+.png" alt="paramount logo" />
              <img className="h-24 mx-10" src="/images/hulu.ico" alt="hulu logo" />
              <img className="h-24 mx-10" src="/images/appletv.ico" alt="appletv logo" />
              <img className="h-24 mx-10" src="/images/Paramount+.png" alt="paramount logo" />
              
            </React.Fragment>
          ))}
        </div>
      </section>
      <section id='pricing' className="py-12 slide-up">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8">Pricing</h2>
          <div className="md:flex justify-center md:space-x-8 m-6 grid-cols-1">
            <div
              className="bg-black border-2 p-6 max-md:mt-4 rounded-lg shadow-lg shadow-blue-300 hover:transition-transform hover:scale-110 hover:ease-in-out hover:duration-[400ms]"
            >
              <h3 className="text-2xl font-bold mb-4">Basic Plan</h3>
              <p className="text-3xl font-bold mb-4">$0</p>
              <p className="mb-4">
                Perfect for providing detailed entertainment descriptions and
                comprehensive ratings, ensuring you have all the information you
                need to make informed viewing choices!
              </p>
              <ul className="mb-4">
                <li>✔ In Depth description</li>
                <li>✔ Genuine ratings</li>
              </ul>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:transition-transform hover:scale-105 hover:ease-in-out hover:duration-[400ms]"
              >
                More info
              </button>
            </div>

            <div
              className="bg-black p-6 max-md:mt-4 rounded-lg shadow-lg border-2 border-blue-500 shadow-blue-500 hover:scale-105 hover:transition-transform hover:ease-in-out hover:duration-[400ms]"
            >
              <h3 className="text-2xl font-bold mb-4">Standard Plan</h3>
              <p className="text-3xl font-bold mb-4">$20</p>
              <p className="mb-4">
                Enjoy unlimited streaming of our vast library of movies and
                series in high-definition. Perfect for entertainment
                descriptions and comprehensive ratings!
              </p>
              <ul className="mb-4">
                <li>✔ Fast Online Streaming</li>
                <li>✔ Latest shows onhand</li>
              </ul>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:transition-transform hover:scale-105 hover:ease-in-out hover:duration-[400ms]"
              >
                More info
              </button>
            </div>

            <div
              className="bg-black border-2 border-white p-6 max-md:mt-4 rounded-lg shadow-lg shadow-blue-300 hover:transition-transform hover:scale-105 hover:ease-in-out hover:duration-[400ms]"
            >
              <h3 className="text-2xl font-bold mb-4">Premium Plan</h3>
              <p className="text-3xl font-bold mb-4">$30</p>
              <p className="mb-4">
                Experience the ultimate entertainment with unlimited HD
                streaming and downloading of movies and series. Enjoy detailed
                descriptions and comprehensive ratings!
              </p>
              <ul className="mb-4">
                <li>✔ Download movies and shows</li>
                <li>✔ Fastest online streaming</li>
              </ul>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:transition-transform hover:scale-105 hover:ease-in-out hover:duration-[400ms]"
              >
                More info
              </button>
            </div>
          </div>
        </div>
      </section>
      </div>
      <section className="py-16 relative overflow-hidden flex justify-center">
      <div className="absolute inset-0 bg-blue-700/10"></div>
      
      {/* Animated particles for background effect */}
      <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 12 }).map((_, index) => (
        <div 
          key={index}
          className="absolute rounded-full bg-blue-700/30 animate-float-pulse"
          style={{
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}
    </div>
      
      <div className="container relative z-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Start Streaming?</h2>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <p className="text-xl text-gray-300 mb-8">
              Join millions of viewers today and get access to thousands of movies and TV shows. 
              First month is on us!
            </p>
          </FadeIn>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={() => router.push('/auth')} className="bg-blue-700 hover:bg-blue-700/90 text-white px-8 py-6 text-lg rounded-full">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={() => {
                const pricingSection = document.getElementById('pricing');
                if (pricingSection) {
                  pricingSection.scrollIntoView({ behavior: 'smooth' });
                }
              }} variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 py-6 text-lg rounded-full glass">
                View Plans
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
    <footer className="pt-20 pb-10 bg-stream-black flex justify-center">
      <div className="container px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1">
            <div className="text-2xl font-bold mb-4">
              Stream<span className="text-blue-700">Box</span>
            </div>
            <p className="text-gray-400 mb-4">
              The ultimate destination for movies and TV shows. Stream anywhere, anytime.
            </p>
            <div className="flex space-x-4">
              <a title='facebook' href="#" className="text-gray-400 hover:text-blue-700 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a title='twitter' href="#" className="text-gray-400 hover:text-blue-700 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a title='instagram' href="#" className="text-gray-400 hover:text-blue-700 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a title='youtube' href="#" className="text-gray-400 hover:text-blue-700 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Press</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
            <p className="text-gray-400 mb-4">Subscribe to our newsletter to get updates on new releases and special promotions.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="bg-black/20 border border-gray-700 rounded-l-lg px-4 py-2 w-full focus:outline-none focus:border-blue-700"
              />
              <button title='mail' className="bg-blue-700 hover:bg-blue-700/90 text-white px-4 rounded-r-lg">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} StreamBox. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-500 hover:text-gray-400 text-sm">Terms</a>
            <a href="#" className="text-gray-500 hover:text-gray-400 text-sm">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-gray-400 text-sm">Cookies</a>
            <a href="#" className="text-gray-500 hover:text-gray-400 text-sm">FAQ</a>
          </div>
        </div>
      </div>
    </footer>
    </div>
    </section>
  )
}

export default home

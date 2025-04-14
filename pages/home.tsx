import router from 'next/router'
import React from 'react'

function home() {
  return (
    <section className="h-screen relative overflow-auto wave bg-black text-white">
        <div
      className="h-16 w-full top-0 right-0 left-0 fixed bg-black bg-opacity-40 backdrop-blur-sm flex justify-between p-5 zoom-in z-30"
    >
      <div className="flex w-full justify-between">
        <div>
        <img src="/images/logo.png" className="h-12" alt="Logo" />
        </div>
        <div>
          <nav className="hidden md:flex space-x-4 font-semibold mt-2 text-white">
            <a
              href="/build/index.html"
              className="no-underline text-blue-500 hover:transition-transform hover:-translate-y-2 hover:ease-in-out hover:duration-500"
              >Home</a
            >
            <a
              href="/build/services.html"
              className="no-underline hover:text-blue-300 hover:transition-transform hover:-translate-y-2 hover:ease-in-out hover:duration-500"
              >Services</a
            >
            <a
              href="/build/movies.html"
              className="no-underline hover:text-blue-300 hover:transition-transform hover:-translate-y-2 hover:ease-in-out hover:duration-500"
              >Movies</a
            >
            <a
              href="/build/about.html"
              className="no-underline hover:text-blue-300 hover:transition-transform hover:-translate-y-2 hover:ease-in-out hover:duration-500"
              >About</a
            >
            <a
              href="/build/contact.html"
              className="no-underline hover:text-blue-300 hover:transition-transform hover:-translate-y-2 hover:ease-in-out hover:duration-500"
              >Contact</a
            >
          </nav>
        </div>
      </div>
      <div>
        <div className="menu-btn md:hidden hover:cursor-pointer">
          <div
            className="btn-line bg-white h-0.5 w-9 m-2 transition-all ease-out"
          ></div>
          <div
            className="btn-line bg-white h-0.5 w-9 m-2 transition-all ease-out"
          ></div>
          <div
            className="btn-line bg-white h-0.5 w-9 m-2 transition-all ease-out"
          ></div>
        </div>
        <div className="menu hidden">
          <nav
            className="flex flex-col space-y-4 bg-opacity-80 bg-black border-[1px] border-blue-600 rounded-md p-4 w-36 top-4 float-right backdrop-blur-sm"
          >
            <a
              href="/build/home.html"
              className="no-underline text-blue-500 hover:text-blue-300 nav-item"
              >Home</a
            >
            <a
              href="/build/services.html"
              className="no-underline hover:text-blue-300 nav-item"
              >Services</a
            >
            <a
              href="/build/movies.html"
              className="no-underline hover:text-blue-300 nav-item"
              >Movies</a
            >
            <a
              href="/build/about.html"
              className="no-underline hover:text-blue-300 nav-item"
              >About</a
            >
            <a
              href="/build/contact.html"
              className="no-underline hover:text-blue-300 nav-item"
              >Contact</a
            >
          </nav>
        </div>
      </div>
    </div>

    <div className="mt-24">
      <section className="bg-black py-16 flex relative px-8 z-10 zoom-in">
        <div
          className="flex relative pt-16 justify-between w-full max-md:grid max-md:grid-cols-1"
        >
          <div
            className="w-full md:w-1/2 p-0 border-separate block static h-[388px] max-w-[760px] pt-[20px]"
          >
            <h2 className="text-5xl font-bold mb-4 block">
              Your Gateway to Unlimited Entertainment
            </h2>
            <p className="text-2xl mb-8 block text-white">
              The ultimate hub for movie and series enthusiasts. Explore a
              diverse collection of titles, complete with in-depth descriptions
              and user ratings.
            </p>
            
              <button
                onClick={() => router.replace('/auth')}
                className="text-white px-4 py-2 rounded-xl hover:scale-95 hover:ease-in-out hover:duration-500 font-bold border-2 button text-xl hover:bg-blue-300 hover:border-blue-300 hover:text-black"
              >
                Stream Now
              </button>
    
          </div>
          <div className="w-1/2 block max-md:w-full">
            <img
              className="rounded-lg object-cover right-0 h-1/2 w-full max-md:mt-8"
              src="/images/inception.jpg"
              alt=""
            />
          </div>
        </div>
      </section>
      <footer className="border-t-[1px] mx-4 py-16 slide-up">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap">
            <div className="w-full sm:w-1/2 md:w-1/4 mb-8 sm:mb-0 px-4">
              <h4 className="text-white text-lg font-semibold mb-8">Company</h4>
              <ul>
                <li
                  className="mb-2 hover:transition-transform hover:translate-x-3 ease-in-out duration-500"
                >
                  <a
                    href="/build/about.html"
                    className="text-gray-400 hover:text-white"
                    >About Us</a
                  >
                </li>
                <li
                  className="mb-2 hover:transition-transform hover:translate-x-3 ease-in-out duration-500"
                >
                  <a
                    href="/build/services.html"
                    className="text-gray-400 hover:text-white"
                    >Our Services</a
                  >
                </li>
                <li
                  className="mb-2 hover:transition-transform hover:translate-x-3 ease-in-out duration-500"
                >
                  <a href="#" className="text-gray-400 hover:text-white"
                    >Privacy Policy</a
                  >
                </li>
                <li
                  className="mb-2 hover:transition-transform hover:translate-x-3 ease-in-out duration-500"
                >
                  <a href="#" className="text-gray-400 hover:text-white"
                    >Affiliate Program</a
                  >
                </li>
              </ul>
            </div>
            <div className="w-full sm:w-1/2 md:w-1/4 mb-8 sm:mb-0 px-4">
              <h4 className="text-white text-lg font-semibold mb-8">Get Help</h4>
              <ul>
                <li
                  className="mb-2 hover:transition-transform hover:translate-x-3 ease-in-out duration-500"
                >
                  <a href="#" className="text-gray-400 hover:text-white">FAQ</a>
                </li>
                <li
                  className="mb-2 hover:transition-transform hover:translate-x-3 ease-in-out duration-500"
                >
                  <a href="#" className="text-gray-400 hover:text-white">Reviews</a>
                </li>
                <li
                  className="mb-2 hover:transition-transform hover:translate-x-3 ease-in-out duration-500"
                >
                  <a href="#" className="text-gray-400 hover:text-white"
                    >User Requests</a
                  >
                </li>
                <li
                  className="mb-2 hover:transition-transform hover:translate-x-3 ease-in-out duration-500"
                >
                  <a href="#" className="text-gray-400 hover:text-white"
                    >Payment Options</a
                  >
                </li>
              </ul>
            </div>
            <div className="w-full sm:w-1/2 md:w-1/4 mb-8 sm:mb-0 px-4">
              <h4 className="text-white text-lg font-semibold mb-8">
                Capabilities
              </h4>
              <ul>
                <li
                  className="mb-2 hover:transition-transform hover:translate-x-3 ease-in-out duration-500"
                >
                  <a href="#" className="text-gray-400 hover:text-white"
                    >Stream Movies</a
                  >
                </li>
                <li
                  className="mb-2 hover:transition-transform hover:translate-x-3 ease-in-out duration-500"
                >
                  <a href="#" className="text-gray-400 hover:text-white"
                    >Stream TV Shows</a
                  >
                </li>
                <li
                  className="mb-2 hover:transition-transform hover:translate-x-3 ease-in-out duration-500"
                >
                  <a href="#" className="text-gray-400 hover:text-white"
                    >Super-Fast Streaming</a
                  >
                </li>
                <li
                  className="mb-2 hover:transition-transform hover:translate-x-3 ease-in-out duration-500"
                >
                  <a href="#" className="text-gray-400 hover:text-white"
                    >Download Movies & Shows</a
                  >
                </li>
              </ul>
            </div>
            <div className="w-full sm:w-1/2 md:w-1/4 mb-8 sm:mb-0 px-4">
              <h4 className="text-white text-lg font-semibold mb-8">Follow Us</h4>
              <div className="flex space-x-4">
                <a
                  href="#"
                  title="Facebook"
                  className="w-10 h-10 flex font-bold items-center justify-center bg-white bg-opacity-20 text-white rounded-full hover:bg-white hover:text-gray-800 transition"
                  ><i
                    className="fab fa-facebook text-lg text-white hover:text-gray-800"
                  ></i
                ></a>
                <a
                  href="#"
                  title="Twitter"
                  className="w-10 h-10 flex font-bold items-center justify-center bg-white bg-opacity-20 text-white rounded-full hover:bg-white hover:text-gray-800 transition"
                  ><i
                    className="fab fa-twitter text-white text-lg hover:text-gray-800"
                  ></i
                ></a>
                <a
                  href="#"
                  title="Instagram"
                  className="w-10 h-10 flex font-bold items-center justify-center bg-white bg-opacity-20 text-white rounded-full hover:bg-white hover:text-gray-800 transition"
                  ><i
                    className="fab fa-instagram text-white text-lg hover:text-gray-800"
                  ></i
                ></a>
                <a
                  href="#"
                  title="LinkedIn"
                  className="w-10 h-10 flex font-bold items-center justify-center bg-white bg-opacity-20 text-white rounded-full hover:bg-white hover:text-gray-800 transition"
                >
                  <i
                    className="fab fa-linkedin text-white text-lg hover:text-gray-800"
                  ></i>
                </a>
              </div>
              <div className="text-gray-300 mt-8 font-thin text-sm">
                Copyright &copy; 2024 StreamBox&reg;. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </section>
  )
}

export default home

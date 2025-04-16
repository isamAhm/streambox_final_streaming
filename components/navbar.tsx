// import { useState, useEffect } from "react";
// // import { Button } from "@/components/ui/button";
// import { Search, Menu, X } from "lucide-react";

// import { motion } from "framer-motion";

// export function HomeNavbar() {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);

  

//   return (
//     <motion.header
//       initial={{ y: -100 }}
//       animate={{ y: 0 }}
//       transition={{ duration: 0.5, ease: "easeOut" }}
//       className="justify-center md:flex fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-black/80 backdrop-blur-md py-3 scroll-bar" 
//     >
//       <div className="container px-4 sm:px-6 flex items-center justify-between">
//         <div className="flex items-center">
//           <img src="/images/favicon1.png" className="h-10 w-10" alt="logo" />
//           <p className="pl-2 font-semibold">StreamBox</p>
          
//           <nav className="hidden md:flex ml-10 space-x-8">
//             <a href="#" className="text-white/80 hover:text-white transition-colors">Home</a>
//             <a href="#" className="text-white/80 hover:text-white transition-colors">Movies</a>
//             <a href="#" className="text-white/80 hover:text-white transition-colors">TV Shows</a>
//             <a href="#" className="text-white/80 hover:text-white transition-colors">New & Popular</a>
//           </nav>
//         </div>
        
//         <div className="hidden md:flex items-center space-x-4">
//           <button title="search" className="text-white/80 hover:text-white p-2">
//             <Search className="w-5 h-5" />
//           </button>
//           <button className="border-white/20 bg-white/5 hover:bg-white/10 text-white">
//             Sign In
//           </button>
//           <button className="bg-stream-accent hover:bg-stream-accent/90 text-white">
//             Sign Up
//           </button>
//         </div>
        
//         {/* Mobile menu button */}
//         <button 
//           className="md:hidden text-white p-2"
//           onClick={() => setIsMenuOpen(!isMenuOpen)}
//         >
//           {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
//         </button>
//       </div>
      
//       {/* Mobile menu */}
//       <div className={`md:hidden ${isMenuOpen ? "block" : "hidden"}`}>
//         <div className="py-4 px-4 bg-stream-black/95 backdrop-blur-md">
//           <nav className="flex flex-col space-y-4">
//             <a href="#" className="text-white/80 hover:text-white transition-colors py-2">Home</a>
//             <a href="#" className="text-white/80 hover:text-white transition-colors py-2">Movies</a>
//             <a href="#" className="text-white/80 hover:text-white transition-colors py-2">TV Shows</a>
//             <a href="#" className="text-white/80 hover:text-white transition-colors py-2">New & Popular</a>
//           </nav>
//           <div className="mt-6 flex flex-col space-y-3">
//             <button className="border-white/20 bg-white/5 hover:bg-white/10 text-white w-full">
//               Sign In
//             </button>
//             <button className="bg-stream-accent hover:bg-stream-accent/90 text-white w-full">
//               Sign Up
//             </button>
//           </div>
//         </div>
//       </div>
//     </motion.header>
//   );
// }

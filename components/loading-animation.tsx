import { motion } from "framer-motion";

export function LoadingAnimation() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
      <div className="text-center">
        <motion.div 
          className="relative w-24 h-24 mx-auto mb-8"
          animate={{ rotate: 360 }}
          transition={{ 
            repeat: Infinity, 
            duration: 2,
            ease: "linear" 
          }}
        >
          <motion.div 
            className="absolute top-0 left-0 w-full h-full border-4 border-blue-800/30 rounded-full"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute top-0 left-0 w-full h-full border-t-4 border-blue-700 rounded-full"
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-white text-2xl font-bold mb-2 font-[Poppins]">
            Stream<span className="text-blue-900">Box</span>
          </h2>
          <p className="text-gray-400">Loading amazing content...</p>
        </motion.div>
      </div>
    </div>
  );
}
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

const Navbar = () => {
  const { account, connectWallet } = useWallet();
  const location = useLocation();

  return (
    <nav className="fixed w-full top-0 z-50 nav-blur transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0">
            <Link 
              to="/" 
              className="text-3xl md:text-4xl font-bold gradient-text"
            >
              OneID
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-16 flex items-center space-x-12">
              <Link 
                to="/" 
                className={`${location.pathname === '/' ? 'text-white' : 'text-gray-300'} hover:text-white text-lg`}
              >
                Home
              </Link>
              {account && (
                <>
                  <Link 
                    to="/scan" 
                    className={`${location.pathname === '/scan' ? 'text-white' : 'text-gray-300'} hover:text-white text-lg`}
                  >
                    Scan Document
                  </Link>
                  <Link 
                    to="/dashboard" 
                    className={`${location.pathname === '/dashboard' ? 'text-white' : 'text-gray-300'} hover:text-white text-lg`}
                  >
                    Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {account && (
              <span className="text-gray-300 text-sm bg-gray-800/50 px-4 py-2 rounded-lg">
                {`${account.slice(0, 6)}...${account.slice(-4)}`}
              </span>
            )}
            <button 
              onClick={connectWallet} 
              className={`px-6 py-2.5 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                account 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30' 
                  : 'button-gradient text-white hover:opacity-90'
              }`}
            >
              <div className={`flex items-center space-x-2 ${account ? 'animate-fadeIn' : ''}`}>
                {account && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                )}
                <span className="text-lg">{account ? 'Wallet Connected' : 'Connect Wallet'}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 
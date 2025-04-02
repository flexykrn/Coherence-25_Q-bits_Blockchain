import React from "react";

function DIDCard({
  account,
  error,
  connectWallet,
  did,
  setDid,
  publicKey,
  setPublicKey,
  isRegistered,
  registerDID,
  loginWithDID,
}) {
  return (
    <div className="md:w-1/2 flex justify-center">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Decentralized Identity (DID)
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          onClick={connectWallet}
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          {account
            ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
            : "Connect Wallet"}
        </button>

        {account && !isRegistered && (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Enter DID"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 my-2"
              value={did}
              onChange={(e) => setDid(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter Public Key"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 my-2"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
            />
            <button
              onClick={registerDID}
              className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
            >
              Register DID
            </button>
          </div>
        )}

        {isRegistered && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              <strong>Your DID:</strong> {did}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Public Key:</strong> {publicKey}
            </p>
            <button
              onClick={loginWithDID}
              className="w-full py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition mt-2"
            >
              Login with DID
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DIDCard;

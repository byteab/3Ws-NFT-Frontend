import "./App.css"
import twitterLogo from "./assets/twitter-logo.svg"
import * as React from "react"
import { ethers } from "ethers"
import { abi } from "./assets/abi.json"

// Constants
const TWITTER_HANDLE = "_buildspace"
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`
const OPENSEA_LINK = ""
const TOTAL_MINT_COUNT = 50

const App = () => {
  const [currentAccount, setCurrentAccount] = React.useState()
  const CONTRACT_ADDRESS = "0xD4329b26982FACD28B3ba1E2f1aAfc93DDa7E7C2"
  const [status, setStatus] = React.useState<"idle" | "loading" | "mining">(
    "idle"
  )
  const [tokenId, setTokenId] = React.useState<null | number>(null)
  const [totalNFTs, setTotalNFTs] = React.useState<null | number>(null)

  React.useEffect(() => {
    if (currentAccount) {
      getTotalNFTs()
    }
  }, [currentAccount])

  const getTotalNFTs = async () => {
    const { ethereum } = window as any
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer)
      const totalNFTs = await contract.getNFTsMintedSoFar()
      setTotalNFTs(totalNFTs.toNumber())
    } else {
      alert("Make sure metamask is installed")
    }
  }

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window as any

    if (!ethereum) {
      console.log("Make sure you have metamask!")
      return
    } else {
      console.log("We have the ethereum object", ethereum)
    }

    /**
     * get me all ethereum accounts. if I am already authorized in [Metamask]
     */
    const accounts = await ethereum.request({ method: "eth_accounts" })

    if (accounts.length) {
      console.log("Found an authorized account: ", accounts[0])
      setCurrentAccount(accounts[0])
    } else {
      console.log("not authorized")
    }
  }

  const askContractToMintNft = async () => {
    const { ethereum } = window as any

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          abi,
          signer
        )
        console.log("Going to pop wallet now to pay gas...")
        setStatus("mining")
        let nftTxn = await connectedContract.makeAnEpicNFT()

        console.log("Mining...please wait.")
        await nftTxn.wait()

        setStatus("idle")

        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        )
      } else {
        console.log("ethereum object doesn't exists")
      }
    } catch (error) {
      console.log(error)
      setStatus("idle")
    }
  }

  React.useEffect(() => {
    if (currentAccount) {
      setupEventListener()
    }
  }, [currentAccount])

  const connectWallet = async () => {
    try {
      console.log("connectWallet")
      const { ethereum } = window as any

      if (!ethereum) {
        alert("Get Metamask!")
        return
      }
      /**
       * get me all ethereum accounts. if not authorized then authorize me first
       */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" })
      console.log("connected ", accounts[0])
      setCurrentAccount(accounts[0])
    } catch (error) {
      console.log(error)
    }
  }
  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window as any

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          abi,
          signer
        )

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          setTokenId(tokenId)
          alert(
            `Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          )
        })

        console.log("Setup event listener!")
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  React.useEffect(() => {
    checkIfWalletIsConnected()
  }, [])

  // Render Methods
  const renderNotConnectedContainer = () => {
    if (currentAccount) return null
    return (
      <button
        onClick={connectWallet}
        className="cta-button connect-wallet-button"
      >
        Connect to Wallet
      </button>
    )
  }

  const renderMintUI = () => {
    if (currentAccount) {
      return (
        <button
          onClick={askContractToMintNft}
          className="cta-button connect-wallet-button"
        >
          {status === "mining" ? "Mining..." : "Mint NFT"}
        </button>
      )
    } else {
      return null
    }
  }

  let openSeaAddress = null

  if (tokenId) {
    openSeaAddress =
      "https://testnets.opensea.io/assets/" + CONTRACT_ADDRESS + tokenId
  }

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          <div className="buttons-container">
            {renderNotConnectedContainer()}
            {renderMintUI()}
            {openSeaAddress ? (
              <a target="_blank" href={openSeaAddress} className="opensea">
                {`${tokenId || totalNFTs} / 100 NFT Minted, see your NFT in Opensea`}
              </a>
            ) : null}
          </div>
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  )
}

export default App

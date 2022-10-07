import {useEffect,useState} from 'react'
import { Connection, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Body } from './Body';

function Home() {
  const [walletAddress, setWalletAddress] = useState("");
  const [checkWalletPresent, setCheckWalletPresent] = useState(false)
  const [loading, setLoading] = useState(false)

  const checkIfPhantomWalletPresent = async() => {
    const { solana } = window;
    if (solana) {
      if (solana.isPhantom) {
        setCheckWalletPresent(true)
        const response = await solana.connect({onlyIfTrusted:true})
        setWalletAddress(response.publicKey.toString())
      }else{
        alert("please connect to phantom wallet");
      }
    }
  };

  const connectwallet = async() =>{
    const {solana} = window
    if(solana)
    {
      const response = await solana.connect();
       console.log("wallet address", response);
      setWalletAddress(response.publicKey.toString());
    }else{
      alert('phantom not connected')
    }
  } 

  useEffect(() => {
    // console.log(window.solana)
    const load =  () => {
       checkIfPhantomWalletPresent();
    };
    window.addEventListener("load", load);
    return( () => window.removeEventListener("unload", load));
  }, [walletAddress]);

  return (
    // style={{backgroundColor:'rgb(66,66,66)'}}  
    <div className="App" >
      <h1> <u> PATREON PORTAL </u>  </h1>
      {checkWalletPresent ? (
        <div>
          {/* <p> {console.log('wallet address',walletAddress)} </p> */}
          {walletAddress  ? <Body walletAddress={walletAddress} />  : <button onClick={connectwallet}> connect wallet </button>}
         
        </div>
      ):<button onClick={()=>window.open('https://phantom.app')}> Please install Phantom wallet</button>}
    </div>
  );
}

export default Home;

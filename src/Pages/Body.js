import { Connection, PublicKey, clusterApiUrl,LAMPORTS_PER_SOL  } from '@solana/web3.js';
import { Program, AnchorProvider, web3, utils } from '@project-serum/anchor';
import { useEffect,useState } from 'react';
import {Buffer} from 'buffer'
import { programs } from "@metaplex/js"
import * as metadata from "@metaplex-foundation/mpl-token-metadata";
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import idl from '../idl.json'
import { Donate } from './donate';

window.Buffer = Buffer
const {SystemProgram,Keypair} = web3;

const network = clusterApiUrl("devnet")
const opts = {
  preflightCommitment:"processed",
}
const patreonNewkeyPair = Keypair.generate();
const connection = new Connection(network, opts.preflightCommitment);

// const mediaNFT = web3.Keypair.fromSecretKey(secret)
const programID = new PublicKey(idl?.metadata?.address)

export const Body = ({walletAddress}) => {

    const { solana } = window;
    const [link,setLink] = useState('') 
    const [mintAddress, setMintAddress] = useState([])
    const [allowUser, setAllowUser] = useState([])
    const [balance, setBalance] = useState(0)
     const getProvider = () => {
      //Creating a provider, the provider is authenication connection to solana
      const connection = new Connection(network, opts.preflightCommitment);
      const provider = new AnchorProvider(
        connection,
        window.solana,
        opts.preflightCommitment
      );
      return provider;
    };
    
    useEffect(()=>{
      // getAccountInfo()
      // getTransactions()
      getBalanace()
      getPatreonDetails()
      getTokenParsedFromWalletAccounts()
    },[])

    const getBalanace=async ()=>{
        try{
            let provider = window.solana;
            let connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
            // After Connecting
           
            const walletBalance  = await connection.getBalance(provider.publicKey)
            setBalance((walletBalance) / LAMPORTS_PER_SOL)
            // console.log(
            //     `Wallet balance is ${(walletBalance) / LAMPORTS_PER_SOL} SOL`
            //   );
        }catch(err){
            console.error(err)
        }
    }

   

    const getAccountInfo = async () => {
      try {
        let provider = window.solana;
        let connection = new Connection(clusterApiUrl("devnet"), "confirmed");
       
        // console.log("publickey", provider.publicKey.toString());
        const nftsmetadata = await metadata.Metadata.findDataByOwner(
          connection,
          provider.publicKey
        );
        console.log(nftsmetadata)
        if (nftsmetadata.length > 0) {
          let mintAddressData = [];
          for (let i in nftsmetadata) {
            mintAddressData.push(nftsmetadata[i].mint);
          }
          console.log(mintAddressData)
          // setMintAddress(mintAddressData)
        }
      } catch (err) {
        console.error(err);
      }
    };

    const getTransactions = async() =>{
      try{
        let provider = window.solana;
        let connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        // console.log("publickey", provider.publicKey.toString());
        const transSignatures = await connection.getSignaturesForAddress(provider.publicKey);
        // console.log('transaction signatures',transSignatures)
        const transactions = [];
        for (let i = 0; i < transSignatures.length; i++) {
          const signature = transSignatures[i].signature;
          const time  = new Date(transSignatures[i].blockTime*1000)
          const confirmedTransaction = await connection.getTransaction(
            signature,
          );
          if (confirmedTransaction) {
            const { meta } = confirmedTransaction;
            const {transaction} = confirmedTransaction;
            console.log('trasaction',transaction)
            if (meta) {
              const oldBalance = meta.preBalances;
              const newBalance = meta.postBalances;
              const wallet1 = transaction.message.accountKeys[0].toString()
              const wallet2 = transaction.message.accountKeys[1].toString()
              const amount = oldBalance[0] - newBalance[0];
              const transWithSignature = {
                signature,
                time,
                wallet1,
                wallet2,
                // ...confirmedTransaction,
                fees: meta?.fee,
                amount,
              };
              // console.log('transWithSignature',transWithSignature.transaction.message.accountKeys[0].toString(),transWithSignature.transaction.message.accountKeys[1].toString(),transWithSignature.transaction.message.accountKeys[2].toString())
             
              transactions.push(transWithSignature);
            }
          }
        }
        console.log('overall transaction information',transactions);
      }catch(err){
        console.log(err)
      }
    }
   
    const getTokenParsedFromWalletAccounts = async() =>{
      let allTokens=[]
      try {
        let provider = window.solana;
        let connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        const filters = [
          {
            dataSize: 165,
          },
          {
            memcmp: {
              offset: 32, // number of bytes
              bytes: walletAddress, //wallet address
            },
          },
        ]
        //provider.publicKey
        const tokenAccounts = await connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID,{filters});
        tokenAccounts.forEach((account,i)=>{
        const parsedAccountInfo = account.account.data
        if(parsedAccountInfo?.parsed?.info.tokenAmount.amount>0)
        {
          allTokens.push(parsedAccountInfo?.parsed?.info?.mint)
        }
        // console.log('parsed accounts',parsedAccountInfo?.parsed?.info?.mint,parsedAccountInfo?.parsed?.info.tokenAmount.amount)
        })
        // console.log(allTokens)
        getDataFromVerifyPatreonTokenAccount(allTokens)
        
      }catch(err){
        console.log('err',err)
      }
    }
    //setMintAddress(allTokens)
  // {getNFTParsedAccounts()}
    
    const getDataFromVerifyPatreonTokenAccount = async(allWalletTokens) =>{
      let filteredData=[]
      const provider = getProvider()
      const program = new Program(idl,programID,provider)
      try{
        const tokenDatas = await program.account.verifyPatreonTokenDetails.all() //await program.account.verifyPatreonToken.all()//await connection.getProgramAccounts(programID)
       
        if(tokenDatas.length>0 && allWalletTokens.length>0){
          for(let x in tokenDatas){
            // console.log('information',tokenDatas[x]?.account?.tokenAddress.split('-')[1])
            if(tokenDatas[x].account.tokenAddress.includes('-') && allWalletTokens.includes(tokenDatas[x]?.account?.tokenAddress.split('-')[1]) && (Math.floor(Date.now() / 1000) < Number(tokenDatas[x].account.date)) ) //check this condition again
            {
              // console.log('hello',tokenDatas[x],tokenDatas[x]?.account.date)
              filteredData.push(tokenDatas[x]?.account?.tokenAddress.split('-')[0])
            }
          }
          setAllowUser(filteredData)
        }
      }catch(err){
        console.log(err)
      }
    }
    
    //mint.account.patreonFundAddress.toString()
    // console.log((Math.floor(Date.now() / 1000) < tokenDatas[x]?.account.date.toNumber()))
    //getDataFromVerifyPatreonTokenAccount()
    // console.log('now',  new Date( Date.now() * 1000);)
    // console.log('verifytokens',datas[x]?.account.date.toNumber(),datas[x]?.account, datas[x]?.account.date.toNumber(),allTokens.includes(datas[x]?.account?.tokenAddress))
    // console.log(Math.floor(Date.now() / 1000) < datas[x]?.account.date.toNumber())
   

    const getPatreonDetails = async () =>{
      let alldatas=[]
      const provider = getProvider()
      const program = new Program(idl,programID,provider)
      const datas =  await program.account.adminDetails.all()
      // console.log(datas)
      // console.log(datas[i].account.time.toNumber(),datas[i].account.name)
      for(let i in datas){
        if(!((datas[i].account.name).toLowerCase().includes('test'))){
          alldatas.push(datas[i])
        }
      }
      // console.log(alldatas)
      const arrdata =alldatas.sort( (a,b)=> (b.account.time.toNumber())-(a.account.time.toNumber()))
      setMintAddress(alldatas)
    }

    

  return (
    <div>
      <h4> Your walletAddress - {walletAddress} </h4>
      <br />
      
      <h2> <u> List of Patreons </u>  </h2>
      {/* {balance<3 && <h1> Please maintain wallet balance more than or equal to 3 SOL <p> To see patreons </p>  </h1>  } */}
      {
         mintAddress && mintAddress.map( (mint, index) =>(
          
              <div key={index}>
                
                <div className="  card bg-light mb-3 mx-auto" style={{maxWidth: "30rem"}}>
                  <div className="card-header"> <b> <u>Patreon Wallet Address </u> </b> {mint.account.patreonFundAddress.toString()}</div>
                  <div className="card-body">
                    <h5 className="card-title"> Name - {mint.account.name}</h5>
                    <p className="card-text"> Description -  {mint.account.description}</p>
                    <h5 className="card-title"> Amount - { mint.account.amount.toNumber() > LAMPORTS_PER_SOL ? mint.account.amount.toNumber()/LAMPORTS_PER_SOL :mint.account.amount.toNumber()   } SOL  </h5>
                    <p className="card-text"> Owner - {mint.account.owner.toString()} </p>
                    {/* <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p> */}
                   { 
                   
                   !allowUser.includes(mint.account.patreonFundAddress.toString()) &&
                   <Donate balance={balance} ownerAddress={mint.account.owner.toString()} getTokenParsedFromWalletAccounts={getTokenParsedFromWalletAccounts} getProvider={getProvider} connection={connection} patreonFundAddressPDA={mint.account.patreonFundAddress.toString()} fundAmount={mint.account.amount.toNumber() > LAMPORTS_PER_SOL ? mint.account.amount.toNumber()/LAMPORTS_PER_SOL :mint.account.amount.toNumber() } Program={Program} idl={idl} programID={programID} patreonNewkeyPair={patreonNewkeyPair} walletAddress={walletAddress} SystemProgram={SystemProgram}  />
                  }
                    { 
                     allowUser.includes(mint.account.patreonFundAddress.toString()) && <div className=" m-2 card bg-info mb-3 mx-auto">
                      <b className='m-1' > 🥳 <u>   Successfully Unlocked the data </u> 🥳  </b>
                        <b> Access</b>   <p className="card-text"> {mint.account.contents}</p>
                        <b> SecretURL</b> <p className="card-title"> {mint.account.url}</p> 
                      </div>
                    }
                  </div>
                </div>
              
              </div>
          ))
        }
     
     

      {/* {mintAddress &&
        mintAddress.map(
          (address, index) =>
            address === "8yP77L6mnW3r7fbegeiwR5fps2vuF3xKVZTfwbL31otD" && (
              <div key={index}>
                <img src="https://i.pinimg.com/originals/13/01/7f/13017f759d2961d07a03190ef28286e7.jpg" />
                <br />
                <iframe width="750" height="750" src="https://www.youtube.com/embed/nqye02H_H6I?controls=0" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                </div>
            )
        )} */}
        
     {/* { allowUser &&  <img src="https://i.pinimg.com/originals/13/01/7f/13017f759d2961d07a03190ef28286e7.jpg" />} */}
      {/* <button onClick={getNFTParsedAccounts}> getNFTParsedAccounts </button>
      <button onClick={getData}> getData </button> */}
      {/* <button onClick={getTransactions}> getTransactions </button>
      <button onClick={getAccountInfo}> getAccounts </button> */}
    </div>
  );
};

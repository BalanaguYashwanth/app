import { LAMPORTS_PER_SOL, PublicKey,SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
import { utils, web3, Wallet } from '@project-serum/anchor';
import { BN } from "@project-serum/anchor";
import axios from 'axios'
// import {
//     ASSOCIATED_TOKEN_PROGRAM_ID,
//     getAssociatedTokenAddress,
//     TOKEN_PROGRAM_ID,
// } from '@solana/spl-token';
import kp from '../keypair.json'
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,NATIVE_MINT,
  createAssociatedTokenAccountInstruction,
  getAccount,createInitializeMintInstruction,
  createMint,getOrCreateAssociatedTokenAccount,
  mintTo, createAssociatedTokenAccount,
   getAssociatedTokenAddress, 
   transfer} from "@solana/spl-token"
import { useState } from "react";

//main purpose of this flow is - when user starts donate then it initiates i.e createPatreon and get the keys etc and sent to transfer token
export const Donate = ({balance,ownerAddress,getTokenParsedFromWalletAccounts,getProvider,Program,patreonFundAddressPDA,fundAmount,idl,programID,patreonNewkeyPair,SystemProgram,walletAddress,connection}) =>{
  // console.log(fundAmount)
    //get the public hard coded value from the admin, and call this donate from admin might be best rather than calling from body.js
    const [message, setMessage] = useState('')
    let getBinaryFromWalletAddress = new PublicKey(patreonFundAddressPDA) //B2X3R8oTmYB5cV3FBwQ7bbfrc46dhgCJAVmXkDzSurGM //6xxbFNeTtygiMtYXQEy846n5U9Q6bTmwFtUmje9kBHoS
    //5NAbfxgXsVHYc86PFdJBg9zaXQBS5HuRHyLUdCeEzemF //FCt2MtPXj3NtVYW8JCXEDnKJhoJZVdC1vUNp8x5hKFN5
    // console.log(getBinary.toString())
    //tx 5QZQUgX6o6udbEUKfGJtSX86X5cAJ6znmsYbKZ6erpwbV7fneWEfmv8E5z9XnVBtYgj9cG6yo23S3FmEENoqXicj 7KZpZvf8vRPWhpnnR9DSKhteuLgb8hAwNGwpDHwmyvu4

    //tx 46d5kYHMyiXpx7SvKbgG1qsysY9D8K94LxpPvGCBhtnXUKUJibKnEuumWnfdpDKZWjtLdyHw8HMRFBCyzRYab4LJ A2TtqeooiTKDpxyLxGYRJRHC6siEVj9M2V66LKzy8yEY


    // let arr = Object.values(kp._keypair.secretKey)
    // const secret = new Uint8Array(arr)
    // let ownerkey = web3.Keypair.generate()
   
    // console.log('please fund to this - patreonNewkeyPair',patreonNewkeyPair.publicKey.toString())

    const donateWallet = async () => {
      setMessage('Donate process initiating...')
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      try {
        const airdropWalletTX  = await connection.requestAirdrop(patreonNewkeyPair.publicKey,(1*LAMPORTS_PER_SOL)) //if any error occurs change to 1sol
        setMessage('Donate process initiated... TX',airdropWalletTX)
        if(airdropWalletTX)
        {
          const tx = program.rpc.donate(new BN(fundAmount * web3.LAMPORTS_PER_SOL), {
            accounts: {
              patreonAccount: getBinaryFromWalletAddress,
              user: provider.publicKey,
              systemProgram: SystemProgram.programId,
            },
          //   signers: [patreonNewkeyPair],
          });
          setMessage('Donate transaction is success check transaction',await tx)
          console.log("donate tx success", await tx);
          if(tx){
            initializaTokenPDA()
          }
        }else{
          setMessage(`Donate process stopped due to something went wrong... TX - ${airdropWalletTX}, If possible please fund the sol in this wallet ${patreonNewkeyPair.publicKey} and initiate again`)
          console.log('please fund the sol in this wallet --->',patreonNewkeyPair.publicKey) //convert it as notification
        }
        // transfer_token()
      } catch (err) {
        setMessage('Might be solana is down or trying operational transactions continuously, please try after sometime')
        console.log(err);
      }
    };
  

    const initializaTokenPDA = async() =>{  //create the spl tokens to the particular account
      try{
      setMessage(`Initiating NFT transferring to your wallet ${walletAddress}`)
      let transaction = new web3.Transaction()
      const provider = getProvider()
      const program = new Program(idl,programID,provider)
  
      let mintA = await createMint(connection, patreonNewkeyPair,patreonNewkeyPair.publicKey, null, 0);
  
      let myToken_acctA = await getOrCreateAssociatedTokenAccount(connection,patreonNewkeyPair,mintA,patreonNewkeyPair.publicKey)
      await mintTo(connection,patreonNewkeyPair,mintA,myToken_acctA.address,patreonNewkeyPair.publicKey,1)
      let amount =1;
  
       // state PDA for token
      const [user_pda_state, bump_state] = await web3.PublicKey.findProgramAddress(
        [ provider?.wallet?.publicKey?.toBuffer(),myToken_acctA?.address?.toBuffer(),Buffer.from("state")],
        programID
      );
  
  
      if(await connection.getAccountInfo(user_pda_state)==null){
        transaction.add(await program.methods.initializestatepda(bump_state)
        .accounts({
          statepda:user_pda_state,
          owner:walletAddress,
          depositTokenAccount:myToken_acctA.address,
          systemProgram: SystemProgram.programId
        }).signers([patreonNewkeyPair])
        .instruction())
      }

      // console.log('programId',transaction.programId.toString(),'Initialized TokenPDA to get tokens tx',transaction,'depositTokenAccount',myToken_acctA.address.toString(),'statepda',user_pda_state.toString(),'mint',mintA.toString())
      setMessage(`Transferring NFT to your wallet ${walletAddress} please wait....`)
      if(transaction){
        transfer_token(mintA.toString())
       }
      }catch(err){
        setMessage(`Stopped NFT transferring to your wallet  ${walletAddress}, please try again after sometime`)
        console.log(err)
      }
    }

    const transfer_token = async (mintA) => {
      setMessage(`Transferring NFT to your wallet ${walletAddress} almost done...`)
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const mintKeypair = new PublicKey(
       mintA
      );
      
      const ownerTokenAddress = await utils.token.associatedAddress({
        mint: mintKeypair,
        owner: patreonNewkeyPair.publicKey,
      });
      const buyerTokenAddress = await utils.token.associatedAddress({
        mint: mintKeypair,
        owner: provider.publicKey,
      });
      // console.log('wallet pubkey',provider.publicKey.toString())
      try {
        const tx = await program.rpc.transferNft({
          accounts: {
            buyer: provider.publicKey,
            seller: patreonNewkeyPair.publicKey,
            tokenHolder:patreonNewkeyPair.publicKey,
            mint: mintKeypair,
            ownerTokenAccount:ownerTokenAddress,
            buyerTokenAccount:buyerTokenAddress,
            buyerAuthority:provider.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          },
          signers: [patreonNewkeyPair],
        });
        setMessage(`Transferring NFT to your wallet ${walletAddress} processing.`)
        // console.log("transfer token tx success", await tx);
        if(tx && mintA){
          tokenVerify(mintA)
        }
      } catch (err) {
        setMessage(`Something went wrong NFT transferring failed please try after sometime`)
        console.log(err);
      }
      
      // tasks - Store the PDA (2sol walla), name, amount, description ,mediaurl ,token address, owner and seller and date in one record at rust and later to verify them
    };

    
    const tokenVerify=async(mintA)=>{
      const provider = getProvider()
      const program = new Program(idl,programID,provider)
      try{
        setMessage(`Transferring NFT to your wallet ${walletAddress} processing.`)
        let date = new Date( Math.floor(Date.now() / 1000)* 1000);
        date.setMonth(date.getMonth() + 1);
        date = Date.parse(date) / 1000;
        // console.log('all details',patreonNewkeyPair.publicKey,(date).toString(),patreonFundAddressPDA+'-'+mintA)
        const tx = await program.rpc.verifyalltokens(patreonNewkeyPair.publicKey,(date).toString(),patreonFundAddressPDA+'-'+mintA,{
          accounts:{
            patreonTokenDetails:patreonNewkeyPair.publicKey,
            user:provider.publicKey,
            systemProgram:SystemProgram.programId
          },
          signers:[patreonNewkeyPair]
        })
        console.log('tokenVerify tx succesful',tx)
        setMessage(`Transferred NFT to your wallet ${walletAddress} is success, please check in your wallet after sometime`)
        if(tx){
          // getTokenParsedFromWalletAccounts()
          window.location.reload()
        }
      }catch(err){
        console.log(err)
        setMessage(`Something went wrong please check your wallet have required 2 sol to perform tx, if not found please try after sometime`)
      }
    }



    const withdrawWallet = async() =>{
        const provider = getProvider()
        const program = new Program(idl,programID,provider)
        try{
          const tx = await program.rpc.withdraw(new BN(fundAmount * web3.LAMPORTS_PER_SOL),{
              accounts:{
                  patreonAccount:getBinaryFromWalletAddress,
                  user:walletAddress
              }
              })
              console.log('withdraw tx success',tx)
        }catch(err){
            console.log(err)
        }
    }


   
    return(
        <div>
            {/* <button onClick={initialize}> Initialize </button> */} {/* need to replace with createPatreon but exists in another file in pages please check  */} 
            
           {message && <mark>{message}</mark> }
            <br />
            {/* <button onClick={transfer_token}> Transfer </button> */}
           {/* { ownerAddress !== walletAddress && <button onClick={donateWallet}> Join Now </button>} */}
           { ownerAddress !== walletAddress && (balance >= fundAmount+1 ?  <button onClick={donateWallet}> Join Now </button>  : <mark> Please maintain minimum {fundAmount+1} SOL to perform transaction </mark> )}
            {ownerAddress === walletAddress && <button onClick={withdrawWallet}> withdraw </button> }
            {/* <button onClick={()=>tokenVerify('6dErm7gPLP9FVHrwgGLgEVzrb7fqf7gYeJN64K4zgM8u')}> tokenVerify </button> */}
            
        </div>
    )
}

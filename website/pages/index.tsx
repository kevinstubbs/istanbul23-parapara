import React from "react";
import Image from "next/legacy/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { abi } from "../contract-abi";
import { Enrollment } from "../components/Enrollment";
import { FundBrowser } from "../components/FundBrowser";

const contractConfig = {
  address: "0x86fbbb1254c39602a7b067d5ae7e5c2bdfd61a30",
  abi,
} as const;

const Home: NextPage = () => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [totalMinted, setTotalMinted] = React.useState(0n);
  const { isConnected } = useAccount();

  return (
    <div className="my-8 mb-32">
      <Enrollment />
      <br />
      <br />
      <br />
      <FundBrowser />
    </div>
  );
};

export default Home;

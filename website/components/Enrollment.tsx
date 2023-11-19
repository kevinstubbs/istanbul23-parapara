import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";
// import { BigNumber } from "ethers";
// import { defaultAbiCoder } from "ethers/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { CredentialType, IDKitWidget, ISuccessResult } from "@worldcoin/idkit";
import { defaultAbiCoder } from "ethers/lib/utils";

import { CountryInfo } from "./CountryInfo";
import { abi } from "../abis/out/ParaController.sol/ParaController.json";
import { abi as erc20ABI } from "../abis/out/ERC20.sol/ERC20.json";
import { zeroAddress } from "viem";
import { BigNumber } from "ethers";
import { Button, Heading, Typography } from "@ensdomains/thorin";

// const unpackedProof = decodeAbiParameters([{ type: 'uint256[8]' }], proof)[0]
const decode = <T,>(type: string, encodedString: string): T =>
  defaultAbiCoder.decode([type], encodedString)[0];

export const contractConfig = {
  // address: "0x5ebeac47601a15400c3bf095a24ef5e3164773fc",
  address: "0xb0280aad4f858e8d05af13066a2295aec0a873c2",
  abi,
} as const;

export const erc20ContractConfig = {
  address: "0x2d985715f3fc5ebc643dccd12e99dccf470f52b2",
  abi: erc20ABI,
} as const;

var iso3311a2 = require("iso-3166-1-alpha-2");
const allCountries = iso3311a2.getCountries();

const NotConnected = () => {
  return (
    <div>
      <h3>You must connect your account to see enrollment information.</h3>
    </div>
  );
};

export const useEnrollmentMap = () => {
  const { address } = useAccount();

  const { data: enrollmentData, ...data } = useContractRead<
    any,
    "enrollmentMap",
    any
  >({
    ...contractConfig,
    enabled: address !== zeroAddress && address != null && address !== "0x",
    args: [address],
    functionName: "enrollmentMap",
  });

  const isEnrolled = useMemo(
    () => enrollmentData != null && enrollmentData[0] !== zeroAddress,
    [enrollmentData]
  );

  return { isEnrolled, enrollmentData, ...data };
};

const Connected = () => {
  const { address } = useAccount();
  const [countryCode, setCountryCode] = useState<string>();

  const { isEnrolled, enrollmentData } = useEnrollmentMap();

  // const { config: verifyAndEnrollConfig } = usePrepareContractWrite({
  //   ...contractConfig,
  //   functionName: "verifyAndEnroll",
  // });

  // const {
  //   data,
  //   isLoading,
  //   isSuccess,
  //   isError,
  //   write: verifyAndEnroll,
  // } = useContractWrite({
  //   mode: 'recklesslyUnprepared',
  //   ...contractConfig,
  //   functionName: "verifyAndEnroll",
  //   args:
  // });

  const [proof, setProof] = useState<ISuccessResult | null>();
  const { config, isError } = usePrepareContractWrite({
    ...contractConfig,
    enabled: proof != null && address != null,
    functionName: "verifyAndEnroll",
    args: [
      address!,
      countryCode,
      proof?.merkle_root
        ? decode<BigNumber>("uint256", proof?.merkle_root ?? "")
        : BigNumber.from(0),
      proof?.nullifier_hash
        ? decode<BigNumber>("uint256", proof?.nullifier_hash ?? "")
        : BigNumber.from(0),
      proof?.proof
        ? decode<
            [
              BigNumber,
              BigNumber,
              BigNumber,
              BigNumber,
              BigNumber,
              BigNumber,
              BigNumber,
              BigNumber
            ]
          >("uint256[8]", proof?.proof ?? "")
        : [
            BigNumber.from(0),
            BigNumber.from(0),
            BigNumber.from(0),
            BigNumber.from(0),
            BigNumber.from(0),
            BigNumber.from(0),
            BigNumber.from(0),
            BigNumber.from(0),
          ],
    ],
  });
  console.log([
    address!,
    countryCode,
    proof?.merkle_root
      ? decode<BigNumber>("uint256", proof?.merkle_root ?? "")
      : BigNumber.from(0),
    proof?.nullifier_hash
      ? decode<BigNumber>("uint256", proof?.nullifier_hash ?? "")
      : BigNumber.from(0),
    proof?.proof
      ? decode<
          [
            BigNumber,
            BigNumber,
            BigNumber,
            BigNumber,
            BigNumber,
            BigNumber,
            BigNumber,
            BigNumber
          ]
        >("uint256[8]", proof?.proof ?? "")
      : [
          BigNumber.from(0),
          BigNumber.from(0),
          BigNumber.from(0),
          BigNumber.from(0),
          BigNumber.from(0),
          BigNumber.from(0),
          BigNumber.from(0),
          BigNumber.from(0),
        ],
  ]);
  const {
    write,
    isLoading: inProgress,
    isSuccess,
    isError: isError2,
  } = useContractWrite(config);

  // const encodedSignal = useMemo(
  //   () =>
  //     address == null || countryCode == null
  //       ? undefined
  //       : encodeAbiParameters(
  //           parseAbiParameters("address wallet, string alpha2country"),
  //           [address, countryCode]
  //         ),
  //   [address, countryCode]
  // );
  // console.log({ countryCode });

  return (
    <div className="flex flex-col gap-y-2">
      <Heading>Your Enrollment</Heading>
      {isEnrolled || false ? (
        <div className="flex flex-col gap-y-2">
          <Typography>
            Registered Location: {enrollmentData?.alpha2country}{" "}
          </Typography>
          <CountryInfo country={enrollmentData?.alpha2country} />
        </div>
      ) : null}

      {isSuccess ? <div>Successfully enrolled!</div> : null}
      {isError || isError2 ? (
        <Typography>Enrollment failed. Please try again.</Typography>
      ) : null}

      {false ? (
        <Typography>Enrollment in progress...</Typography>
      ) : !isEnrolled ? (
        <div>
          <Typography>Self-attest</Typography>
          <div>
            <select
              disabled={inProgress}
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              <option>SELECT A COUNTRY</option>
              {allCountries.map((x: string) => (
                <option key={x} value={iso3311a2.getCode(x)}>
                  {x}
                </option>
              ))}
            </select>
          </div>
          {write ? (
            <div>
              <Button onClick={write}>Click to complete Enrollment</Button>
            </div>
          ) : (
            <div>
              <IDKitWidget
                app_id="app_staging_f8c5512ae4a3182d57b85cf0529e0531" // obtained from the Developer Portal
                action="paraenrollment_v1" // this is your action name from the Developer Portal
                signal={address} // any arbitrary value the user is committing to, e.g. a vote
                onSuccess={setProof}
                // TODO: Accept phone verification, but requires on-cloud verification.
                credential_types={[
                  CredentialType.Orb /*, CredentialType.Phone*/,
                ]} // the credentials you want to accept
                enableTelemetry
              >
                {({ open }) => (
                  <Button
                    disabled={countryCode == null || inProgress}
                    loading={inProgress}
                    onClick={open}
                    className="btn"
                  >
                    Approve enrollment with World ID
                  </Button>
                )}
              </IDKitWidget>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export const Enrollment = () => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { isConnected } = useAccount();

  if (!hasMounted) return null;

  if (!isConnected) {
    return <NotConnected />;
  }

  return <Connected />;
};

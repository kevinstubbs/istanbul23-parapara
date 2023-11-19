import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";
import { contractConfig, erc20ContractConfig } from "./Enrollment";
import { useEffect, useRef } from "react";
import { formatUnits, parseEther, parseUnits } from "ethers/lib/utils.js";
import { BigNumber } from "ethers";
import { optimismGoerli } from "wagmi/chains";
import { formatEther } from "viem";
import { Button, Card, Heading, Profile, Typography } from "@ensdomains/thorin";
const unit = require("ethjs-unit");
var iso3311a2 = require("iso-3166-1-alpha-2");

export const ReliefFund = ({ reliefFund, isEnrolled, enrollmentData }: any) => {
  const { address, isConnected } = useAccount();
  const isEligible =
    isEnrolled && reliefFund.alpha2country === enrollmentData.alpha2country;

  const { config: claimConfig, isError: isClaimConfigError } =
    usePrepareContractWrite({
      ...contractConfig,
      chainId: optimismGoerli.id,
      enabled: isConnected && isEligible,
      functionName: "claimTranche",
      args: [reliefFund.kekId],
    });

  const donationAmount = 50;
  const donationAmountBN = parseUnits(donationAmount.toString(), "ether");

  const { data: allowance } = useContractRead<any, "allowance", BigNumber>({
    ...erc20ContractConfig,
    functionName: "allowance",
    args: [address, contractConfig.address],
  });

  const { config: approveConfig, isError: isApproveError } =
    usePrepareContractWrite({
      ...erc20ContractConfig,
      chainId: optimismGoerli.id,
      enabled: isConnected && allowance != null,
      functionName: "approve",
      args: [contractConfig.address, donationAmountBN],
    });

  const {
    config,
    isError: isDonateError,
    error,
  } = usePrepareContractWrite({
    ...contractConfig,
    enabled:
      isConnected &&
      allowance != null &&
      allowance.gte(donationAmountBN) &&
      !reliefFund.isPaused &&
      !reliefFund.isStopped,
    functionName: "donateToReliefFund",
    chainId: optimismGoerli.id,
    args: [reliefFund.kekId, donationAmountBN],
  });

  // console.log({ isApproveError, isDonateError, error });

  const {
    write: setApproval,
    isLoading: approvalLoading,
    isSuccess: approvalSuccess,
    isError: approvalError,
  } = useContractWrite(approveConfig);

  const {
    write,
    isLoading: inProgress,
    isSuccess,
    isError: isError2,
  } = useContractWrite(config);

  const {
    write: claimTranche,
    isLoading: claimInProgress,
    isSuccess: claimSuccess,
    isError: isClaimError,
  } = useContractWrite(claimConfig);

  const hasAskedForAprovalRef = useRef(false);

  useEffect(() => {
    if (approvalSuccess && hasAskedForAprovalRef.current && write) {
      hasAskedForAprovalRef.current = false;
      write();
    }
  }, [approvalSuccess, write]);

  const fundsAfterFee = 100 - reliefFund.fee.toNumber() / 100 - 0.05;
  const availableForDispersal = reliefFund.totalReceived.sub(
    reliefFund.totalDispersed
  );

  return (
    <Card className="px-8 py-4">
      <Heading>{reliefFund.name}</Heading>
      <Card style={{ backgroundColor: "white" }}>
        <Typography>Organized by</Typography>
        <Profile address={reliefFund.organizer} />
      </Card>
      <div className="leading-8 gap-y-2">
        <Typography>
          Targeting parameters: {iso3311a2.getCountry(reliefFund.alpha2country)}{" "}
          ({reliefFund.alpha2country})
        </Typography>
        <Typography className="mt-1"># applicable humans enrolled: #1234</Typography>
      </div>
      <div className="leading-3">
        <Typography fontVariant="small">
          Fee breakdown: {reliefFund.fee.toNumber() / 100}% to organizer. 0.5%
          to platform. {fundsAfterFee}% to human in need.
        </Typography>
        <Typography fontVariant="small">
          Received: ${formatEther(reliefFund.totalReceived)}
        </Typography>
        <Typography fontVariant="small">
          Dispersed: ${formatEther(reliefFund.totalDispersed)}
        </Typography>
        <Typography fontVariant="small">
          Available for dispersal: ${formatEther(availableForDispersal)}
        </Typography>
      </div>
      {isEligible ? (
        false ? (
          <Typography>Successfully claimed!</Typography>
        ) : (
          <div>
            <Typography fontVariant="extraLargeBold" className="mb-2">
              Eligible
            </Typography>
            <div>
              <Button
                colorStyle="greenPrimary"
                loading={claimInProgress}
                disabled={availableForDispersal.lte(0) || claimInProgress}
                onClick={claimTranche}
              >
                {availableForDispersal.lte(0)
                  ? "Not enough funds to claim"
                  : "Claim"}
              </Button>
            </div>
          </div>
        )
      ) : null}
      {!isEligible && !reliefFund.isPaused && !reliefFund.isStopped ? (
        <div>
          {isSuccess ? (
            <Typography>Thanks for the donation!</Typography>
          ) : (
            <Button
              disabled={inProgress || approvalLoading}
              loading={inProgress || approvalLoading}
              onClick={() => {
                if (allowance == null || allowance.lt(donationAmountBN)) {
                  setApproval?.();
                  hasAskedForAprovalRef.current = true;
                } else {
                  write?.();
                }
              }}
            >
              {approvalLoading
                ? "Approving donation..."
                : inProgress
                ? "Donation in transit..."
                : `Donate ${donationAmount} USDC`}
            </Button>
          )}
        </div>
      ) : null}
    </Card>
  );
};

import { useEnrollmentMap } from "./Enrollment";
import { ReliefFund } from "./ReliefFund";

export const FundBrowser = () => {
  const { isEnrolled, enrollmentData } = useEnrollmentMap();

  // const { data: enrollmentData, ...data } = useContractRead<
  //   any,
  //   "enrollmentMap",
  //   any[]
  // >({
  //   ...contractConfig,
  //   args: [address],
  //   functionName: "getAllReliefFunds",
  // });

  // TODO: Come from chain data (or cached off-chain later).
  return (
    <div>
      <h2 className="text-3xl">Funds</h2>
      <div className="flex flex-col gap-y-8 mt-8">
        <ReliefFund
          reliefFund={{ country: "GE" }}
          name="Tbilisi fund"
          isEnrolled={isEnrolled}
          enrollmentData={enrollmentData}
        />
        <ReliefFund
          reliefFund={{ country: "CN" }}
          name="For Uighyrs"
          isEnrolled={isEnrolled}
          enrollmentData={enrollmentData}
        />
        <ReliefFund
          reliefFund={{ country: "TR" }}
          name="Refugees"
          isEnrolled={isEnrolled}
          enrollmentData={enrollmentData}
        />
        <ReliefFund
          reliefFund={{ country: "TR" }}
          name="Earthquake"
          isEnrolled={isEnrolled}
          enrollmentData={enrollmentData}
        />
      </div>
    </div>
  );
};

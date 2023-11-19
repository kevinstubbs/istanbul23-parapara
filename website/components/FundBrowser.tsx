import { useContractRead } from "wagmi";
import { contractConfig, useEnrollmentMap } from "./Enrollment";
import { ReliefFund } from "./ReliefFund";
import { useState, useEffect } from "react";

export const FundBrowser = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const { isEnrolled, enrollmentData } = useEnrollmentMap();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { data: allReliefFunds, ...data } = useContractRead<
    any,
    "enrollmentMap",
    any[]
  >({
    ...contractConfig,
    functionName: "getAllReliefFunds",
    watch: true,
  });

  if (!hasMounted) return null;

  return (
    <div>
      <h2 className="text-3xl">Funds</h2>
      <div className="flex flex-col gap-y-8 mt-8">
        {allReliefFunds?.map((x, i) => (
          <ReliefFund
            key={i}
            reliefFund={x}
            name={x.name}
            isEnrolled={isEnrolled}
            enrollmentData={enrollmentData}
          />
        ))}
      </div>
    </div>
  );
};

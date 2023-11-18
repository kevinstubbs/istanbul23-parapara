import React from "react";
import type { NextPage } from "next";
import { Enrollment } from "../components/Enrollment";
import { FundBrowser } from "../components/FundBrowser";

const Home: NextPage = () => {
  return (
    <div className="my-8 mb-32 mx-8">
      <Enrollment />
      <br />
      <br />
      <br />
      <FundBrowser />
    </div>
  );
};

export default Home;

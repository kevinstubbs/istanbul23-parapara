import "../styles/global.css";
import "@rainbow-me/rainbowkit/styles.css";
import { optimismGoerli } from "wagmi/chains";
import type { AppProps } from "next/app";
import {
  RainbowKitProvider,
  getDefaultWallets,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import { argentWallet, trustWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, configureChains, WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { Navbar, NavbarRight } from "../components/Navbar";
import { Footer } from "../components/Footer";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [optimismGoerli],
  [publicProvider()]
);

const projectId = "04489d551124f86b18c2956e7dee46b2";

const { wallets } = getDefaultWallets({
  appName: "Para Para - Deliver targeted aid to those in need",
  projectId,
  chains,
});

const demoAppInfo = {
  appName: "Para Para - Deliver targeted aid to those in need",
};

const connectors = connectorsForWallets([
  ...wallets,
  {
    groupName: "Other",
    wallets: [
      argentWallet({ projectId, chains }),
      trustWallet({ projectId, chains }),
    ],
  },
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider appInfo={demoAppInfo} chains={chains}>
        <div>
          <div className="flex flex-row w-full justify-between">
            <Navbar />
            <Component {...pageProps} />
            <NavbarRight />
          </div>
          <Footer />
        </div>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default MyApp;

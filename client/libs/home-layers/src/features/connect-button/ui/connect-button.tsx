import { useEffect, useState } from 'react';
import type { ConnectorType } from '@concordium/react-components';
import { detectConcordiumProvider } from '@concordium/browser-wallet-api-helpers';
import { useConnectButton } from '../hooks/use-connect-button';
import { Button } from '@/shared/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { useConcordiumApi } from '@/shared/utils/hooks';
import {
    BROWSER_WALLET,
    WALLET_CONNECT,
} from '@/shared/config/concordium';

export function ConnectButton() {
    const { isConnected } = useConnectButton();

    const {
        account,
        connect,
        connection,
        activeConnectorType,
        setConnection,
        setActiveConnectorType,
    } = useConcordiumApi();

    const [pendingConnectorType, setPendingConnectorType] =
        useState<ConnectorType>();

    const accountPreview = account
        ? `${account.slice(0, 4)}...${account.slice(-4)}`
        : '';

    /**
     * Browser Wallet auto-reconnect.
     *
     * This must only run while Browser Wallet is the active connector.
     * Otherwise detectConcordiumProvider() could accidentally trigger
     * the connect() function belonging to WalletConnect.
     */
    useEffect(() => {
        if (
            activeConnectorType !== BROWSER_WALLET ||
            !connect
        ) {
            return;
        }

        let cancelled = false;

        detectConcordiumProvider()
            .then(async (provider) => {
                const recentlySelectedAccount =
                    await provider.getMostRecentlySelectedAccount();

                if (
                    recentlySelectedAccount &&
                    !cancelled
                ) {
                    connect();
                }
            })
            .catch(() => {
                // Browser Wallet is optional.
                // On mobile devices the extension normally does not exist.
            });

        return () => {
            cancelled = true;
        };
    }, [
        activeConnectorType,
        connect,
    ]);

    /**
     * When a different connector type is selected,
     * WithWalletConnector activates it asynchronously.
     *
     * Wait until that exact connector type becomes active,
     * then initiate the connection.
     */
    useEffect(() => {
        if (
            !pendingConnectorType ||
            activeConnectorType !== pendingConnectorType ||
            !connect
        ) {
            return;
        }

        setPendingConnectorType(undefined);

        connect();
    }, [
        activeConnectorType,
        connect,
        pendingConnectorType,
    ]);

    async function disconnectWallet() {
        if (connection) {
            try {
                await connection.disconnect();
            } catch (error) {
                console.error('Wallet disconnect failed:', error);
            }
        }

        setConnection(undefined);
    }

    async function connectWith(
        connectorType: ConnectorType,
    ) {
        if (connection) {
            await disconnectWallet();
        }

        /**
         * If the requested connector is already active,
         * there is no need to activate it again.
         */
        if (activeConnectorType === connectorType) {
            if (!connect) {
                return;
            }

            connect();
            return;
        }

        /**
         * Otherwise remember what the user selected.
         * The effect above will call connect() only after
         * WithWalletConnector has activated this connector.
         */
        setPendingConnectorType(connectorType);
        setActiveConnectorType(connectorType);
    }

    if (isConnected) {
        return (
            <Button
                onClick={disconnectWallet}
                variant='outline'
                className='min-w-[120px]'
            >
                {accountPreview}
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant='outline'
                    className='min-w-[120px]'
                >
                    Connect
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end'>
                <DropdownMenuItem
                    onSelect={() => {
                        void connectWith(BROWSER_WALLET);
                    }}
                >
                    Browser Wallet
                </DropdownMenuItem>

                <DropdownMenuItem
                    onSelect={() => {
                        void connectWith(WALLET_CONNECT);
                    }}
                >
                    Mobile Wallet
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
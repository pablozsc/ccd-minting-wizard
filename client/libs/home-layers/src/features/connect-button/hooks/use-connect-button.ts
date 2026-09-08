import { useEffect } from 'react';
import { useConcordiumApi } from '@/shared/utils/hooks';
import { useMintStore } from '@/shared/store/mint-store';

export function useConnectButton() {
    const { connection, setConnection } = useConcordiumApi();
    const isTestNet = useMintStore((state) => state.isTestNet);

    useEffect(() => {
        if (!connection) {
            return;
        }

        void connection
            .disconnect()
            .catch((error) => {
                console.error(
                    'Wallet disconnect on network change failed:',
                    error,
                );
            })
            .finally(() => {
                setConnection(undefined);
            });

        // Disconnect only when the Wizard network changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTestNet]);

    return {
        isConnected: !!connection,
    };
}

import { useEffect } from 'react';
import type { ConnectorType } from '@concordium/react-components';
import { useToggleConnection } from './use-toggle-connection';
import { useConcordiumApi } from '@/shared/utils/hooks';
import { BROWSER_WALLET } from '@/shared/config/concordium';
import { useMintStore } from '@/shared/store/mint-store';

export function useConnectButton(
    connectorType: ConnectorType = BROWSER_WALLET,
) {
    const { connection, setActiveConnectorType } = useConcordiumApi();
    const isTestNet = useMintStore((state) => state.isTestNet);

    useEffect(() => {
        connection?.disconnect();
        setActiveConnectorType(connectorType);

        // The effect should only react to connector/network changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connectorType, setActiveConnectorType, isTestNet]);

    return {
        toggleConnection: useToggleConnection(),
        isConnected: !!connection,
    };
}
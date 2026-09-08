import {
    AccountTransactionType,
    CcdAmount,
    ContractName,
    Energy,
    ModuleReference,
    SchemaVersion,
} from '@concordium/web-sdk';
import type { WalletConnection } from '@concordium/react-components';
import { moduleSchemaFromBase64 } from '@concordium/wallet-connectors';
import {
    MAX_CONTRACT_EXECUTION_ENERGY,
} from '@/shared/config/concordium';

export async function contractMint(
    connection: WalletConnection,
    account: string,
    schema: string,
    reference: string,
    contractName: string,
    metadataUrl: string,
    amount: number,
    maxSupply: number,
): Promise<string> {
    return connection.signAndSendTransaction(
        account,
        AccountTransactionType.InitContract,
        {
            initName: ContractName.fromString(contractName),
            amount: CcdAmount.fromCcd(0),
            maxContractExecutionEnergy: Energy.create(
                MAX_CONTRACT_EXECUTION_ENERGY,
            ),
            moduleRef: ModuleReference.fromHexString(reference),
        },
        {
            parameters: {
                premint_tokens: [
                    [
                        '01',
                        [
                            {
                                url: metadataUrl,
                                hash: {
                                    None: [],
                                },
                            },
                            {
                                amount: `${amount}`,
                                max_supply: `${maxSupply}`,
                            },
                        ],
                    ],
                ],
            },
            schema: moduleSchemaFromBase64(
                schema,
                SchemaVersion.V1,
            ),
        },
    );
}

export default {
    async fetch(request: Request) {
        if (request.method !== 'POST') {
            return Response.json(
                { error: 'Method not allowed' },
                { status: 405 },
            );
        }

        const pinataJwt = process.env.PINATA_JWT;

        if (!pinataJwt) {
            console.error('PINATA_JWT is not configured');

            return Response.json(
                { error: 'IPFS service is not configured' },
                { status: 500 },
            );
        }

        try {
            const incomingFormData = await request.formData();
            const file = incomingFormData.get('file');

            if (!(file instanceof File)) {
                return Response.json(
                    { error: 'File is required' },
                    { status: 400 },
                );
            }

            const pinataFormData = new FormData();
            pinataFormData.append('file', file);

            const pinataResponse = await fetch(
                'https://api.pinata.cloud/pinning/pinFileToIPFS',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${pinataJwt}`,
                    },
                    body: pinataFormData,
                },
            );

            if (!pinataResponse.ok) {
                const errorBody = await pinataResponse.text();

                console.error(
                    'Pinata upload failed:',
                    pinataResponse.status,
                    errorBody,
                );

                return Response.json(
                    { error: 'Failed to upload file to IPFS' },
                    { status: 502 },
                );
            }

            const pinataResult = await pinataResponse.json();

            if (
                !pinataResult ||
                typeof pinataResult.IpfsHash !== 'string'
            ) {
                console.error(
                    'Unexpected Pinata response:',
                    pinataResult,
                );

                return Response.json(
                    { error: 'Invalid response from IPFS service' },
                    { status: 502 },
                );
            }

            return Response.json({
                cid: pinataResult.IpfsHash,
            });
        } catch (error) {
            console.error('IPFS upload error:', error);

            return Response.json(
                { error: 'Internal server error' },
                { status: 500 },
            );
        }
    },
};
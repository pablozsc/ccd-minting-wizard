const MAX_METADATA_SIZE = 100 * 1024; // 100 KB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_IMAGE_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
]);

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

            if (file.size === 0) {
                return Response.json(
                    { error: 'File is empty' },
                    { status: 400 },
                );
            }

            const contentType = file.type.toLowerCase();

            const isJson =
                contentType === 'application/json' ||
                contentType === 'text/json';

            const isImage = ALLOWED_IMAGE_TYPES.has(contentType);

            if (!isJson && !isImage) {
                return Response.json(
                    { error: 'Unsupported file type' },
                    { status: 415 },
                );
            }

            let safeFile: File;

            if (isJson) {
                if (file.size > MAX_METADATA_SIZE) {
                    return Response.json(
                        { error: 'Metadata file is too large' },
                        { status: 413 },
                    );
                }

                const fileText = await file.text();

                let metadata: unknown;

                try {
                    metadata = JSON.parse(fileText);
                } catch {
                    return Response.json(
                        { error: 'Invalid JSON metadata' },
                        { status: 400 },
                    );
                }

                if (
                    typeof metadata !== 'object' ||
                    metadata === null ||
                    Array.isArray(metadata)
                ) {
                    return Response.json(
                        { error: 'Metadata must be a JSON object' },
                        { status: 400 },
                    );
                }

                const metadataObject =
                    metadata as Record<string, unknown>;

                if (
                    typeof metadataObject.name !== 'string' ||
                    metadataObject.name.trim().length === 0
                ) {
                    return Response.json(
                        { error: 'Metadata must contain a valid name' },
                        { status: 400 },
                    );
                }

                safeFile = new File(
                    [JSON.stringify(metadataObject)],
                    'metadata.json',
                    {
                        type: 'application/json',
                    },
                );
            } else {
                if (file.size > MAX_IMAGE_SIZE) {
                    return Response.json(
                        { error: 'Image file is too large' },
                        { status: 413 },
                    );
                }

                safeFile = file;
            }

            const pinataFormData = new FormData();
            pinataFormData.append('file', safeFile);

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
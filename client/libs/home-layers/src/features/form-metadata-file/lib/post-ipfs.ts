import { URLS } from '@/shared/config/const';

interface IpfsUploadResponse {
    cid: string;
}

export async function postIpfs(file: File | Blob): Promise<string> {
    const formData = new FormData();

    if (file instanceof File) {
        formData.append('file', file);
    } else {
        formData.append(
            'file',
            new File([file], 'metadata.json', {
                type: file.type || 'application/octet-stream',
            }),
        );
    }

    try {
        const response = await fetch('/api/ipfs', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorBody = await response.text();

            console.error(
                'IPFS API request failed:',
                response.status,
                errorBody,
            );

            throw new Error('Failed to upload file to IPFS');
        }

        const data = (await response.json()) as IpfsUploadResponse;

        if (!data.cid) {
            throw new Error('IPFS API returned no CID');
        }

        return `${URLS.PINATA.VIEW}/${data.cid}`;
    } catch (error) {
        console.error('Error sending file to IPFS:', error);
        throw error;
    }
}
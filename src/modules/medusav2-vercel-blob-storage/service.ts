import {Logger, ProviderDeleteFileDTO, ProviderFileResultDTO, ProviderUploadFileDTO} from "@medusajs/framework/types"
import {AbstractFileProviderService} from "@medusajs/framework/utils"
import {del, put, PutBlobResult} from "@vercel/blob";
import { Readable } from "stream";

type InjectedDependencies = {
    logger: Logger
}

type Options = {
    apiKey: string
    blobReadWriteToken: string
    bucketName: string
}

class VercelFileProviderService extends AbstractFileProviderService {
    protected logger_: Logger
    protected options_: Options
    static identifier = "vercel-blob-storage"

    constructor(
        {logger}: InjectedDependencies,
        options: Options
    ) {
        super()

        this.logger_ = logger
        this.options_ = options

        // Set Vercel Blob token from options
        process.env.BLOB_READ_WRITE_TOKEN = options.blobReadWriteToken
    }

    async upload(
        file: ProviderUploadFileDTO
    ): Promise<ProviderFileResultDTO> {
        try {
            // Convert the binary string to a Buffer and then to a readable stream
            const buffer = Buffer.from(file.content, 'binary');
            const stream = Readable.from(buffer);

            // Use the access property from the file DTO if provided

            const upload: PutBlobResult = await put(file.filename, stream, {
                access: "public",
                contentType: file.mimeType
            });

            this.logger_.info(`File uploaded successfully to Vercel Blob: ${file.filename}`);

            return {
                url: upload.url,
                key: upload.url
            }
        } catch (error) {
            this.logger_.error(`Error uploading file to Vercel Blob: ${error.message}`);
            throw error;
        }
    }

    async delete(file: ProviderDeleteFileDTO): Promise<void> {
        try {
            await del(file.fileKey);
            this.logger_.info(`File deleted successfully from Vercel Blob: ${file.fileKey}`);
        } catch (error) {
            this.logger_.error(`Error deleting file from Vercel Blob: ${error.message}`);
            throw error;
        }
    }
}

export default VercelFileProviderService
import request from 'supertest';
import createApp from '../source/server';



describe("Server Starts", () => {
    it("creates a server", async () => {
        const configuration = {
            port: 3001,
            expressServerOptions: {
                keepAliveTimeout: 5000,
                maxHeadersCount: 100,
                maxConnections: 100,
                headersTimeout: 5000,
                requestTimeout: 5000,
                timeout: 5000
            }
        };

        const {app} = createApp(configuration);
        const server = app.listen(configuration.port);

        expect(server).toBeDefined();

        server.close();
    })

})
require("dotenv").config();
const fs = require("fs");
const connection = require("../src/infra/database/connection")

function parseArgs(argv) {
    return argv.reduce(
        (acc, arg) => {
            if (arg.startsWith("--seeder_create")) { // Example: --seeder_create=seed-users
                acc.seeder_create.is_create = true;
                acc.seeder_create.name = arg.split("=")[1];
            } else if (arg.startsWith("--seeder_run")) { // Example: --seeder_run (all run), --seeder_run=20240101-seed-users (this run)
                const seederArg = arg.split("=");
                if (seederArg[1]) {
                    acc.seeder_run.name = seederArg[1].replace(/[^a-zA-Z0-9_-]/g, '_');
                }
                acc.seeder_run.is_run = true;
            }
            return acc;
        },
        {
            seeder_create: { is_create: false, name: "",},
            seeder_run: { is_run: false, name: ""}
        },
    );
}

async function runMigrateFlow() {
    const args = parseArgs(process.argv.slice(2));

    // Seeder Creation
    if (args.seeder_create.is_create) {
        if (!args.seeder_create?.name) {
            throw new Error("Seeder name is required for seeder creation.");
        }

        const seederDir = "./prisma/seeder";
        const seederName = `${new Date().getTime()}-${args.seeder_create.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.js`;
        const seederFile = `/**\n * Seeder: {seederName}\n */\nmodule.exports = {\n  tableName: "user", // Specify the table name\n  seed: async (conn) => {\n    // Write seed code here\n    // Example:\n    // await conn.user.createMany({\n    //   data: [\n    //     { name: 'John Doe', email: 'john.doe@example.com' },\n    //   ]\n    // });\n  }\n};\n`;
        fs.writeFileSync(`${seederDir}/${seederName}`, seederFile.replaceAll("{seederName}", args.seeder_create?.name));
        console.log(`Creating seeder: ${args.seeder_create.name}`);
    }

    // Seeder Execution
    if (args.seeder_run.is_run) {
        if (args.seeder_run.name) {
            const seederPath = `./prisma/seeder/${args.seeder_run.name}.js`;
            if (!fs.existsSync(seederPath)) {
                throw new Error(`Seeder file not found: ${args.seeder_run.name}.js`);
            }

            const seeder = require(`./seeder/${args.seeder_run.name}.js`);
            await seeder.seed(connection);
            console.log(`Running seeder: ${args.seeder_run.name}.js`);

        } else {
            
            const seederFiles = fs.readdirSync("./prisma/seeder").filter(file => file.endsWith(".js"));
            for (const file of seederFiles) {
                const seeder = require(`./seeder/${file}`);
                await seeder.seed(connection);
                console.log(`Running seeder: ${file}`);
            }

        }
    }

}

runMigrateFlow().catch((error) => {
    const message = error && error.stack ? error.stack : String(error);
    console.error(message);
    process.exitCode = 1;
});

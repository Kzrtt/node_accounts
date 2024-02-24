//? Externos
import chalk from 'chalk'
import inquirer from 'inquirer'

//? Internos
import fs, { mkdirSync } from 'fs'

operation()

//? Funcções

//* Base
function operation() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Oque você deseja fazer? ',
            choices: [
                'Criar Conta',
                'Consultar Saldo',
                'Depositar',
                'Sacar',
                'Sair',
            ],
        }
    ])
    .then((ans) => {
        const action = ans['action']
        
        switch (action) {
            case 'Criar Conta':
                createAcccount()
                break;
            case 'Depositar':
                deposit()
                break;
            case 'Consultar Saldo':
                getBalance()
                break;
            case 'Sacar': 
                withdraw()
                break;
            case 'Sair':
                console.log(chalk.bgBlue.black('Obrigado por utilizar nosso banco!!!'))
                process.exit()
            default:
                break;
        }
    })
    .catch(err => console.log(err))
}

//* Create Account
function createAcccount() {
    console.log(chalk.bgGreen.black('Parabéns por utilizar nosso Banco!!'))
    console.log(chalk.green('Defina as opções da sua conta a seguir: '))
    buildAccount()
}

function buildAccount() {
    inquirer.prompt([
        {
            name: 'accountName',
            message: 'Digite o nome para a conta: '
        },
        {
            name: 'password',
            message: 'Digite sua senha para conta: '
        }
    ])
    .then((ans) => {
        const name = ans['accountName']
        const password = ans['password']
        console.info(ans['accountName'])

        if(!fs.existsSync('users')) {
            fs.mkdirSync('users')
        }

        if(fs.existsSync(`users/${name}.json`)) {
            console.log(chalk.bgRed.black('Essa conta já existe, escolha outro nome...'))
            buildAccount()
            return 
        }

        fs.writeFile(
            `users/${name}.json`, 
            `{"balance": 0, "password": ${password}}`, 
            (err) => {
                console.log(err)
            }
        )

        console.log(chalk.green("Parabéns sua conta foi criada!!"))
        operation()
    })
    .catch(err => console.log(err))
}

//* Deposit
async function deposit() {
    const accountName = await listAccounts()

    if(accountName) {
        inquirer.prompt([
            {
                name: "amount",
                message: "Quanto você deseja depositar: "
            }
        ])
        .then((ans) => {
            const amount = ans['amount']
            updateBalance(accountName, amount, "deposit")
            operation()
        })
        .catch(err => {
            console.log(err)
        })
    }
}

async function listAccounts() {
    if (!fs.existsSync('users')) {
        console.log(chalk.bgRed.black('Nenhuma conta encontrada...'));
        return operation();
    }

    const files = fs.readdirSync('users');
    const accounts = files.map(file => file.replace('.json', ''));

    if (files.length === 0) {
        console.log(chalk.bgRed.black('Nenhuma conta encontrada...'));
        return operation();
    }

    try {
        const response = await inquirer.prompt([
            {
                type: 'list',
                name: 'accountName',
                message: 'Qual o nome da sua conta: ',
                choices: accounts,
            },
        ]);

        // Solicitação da senha imediatamente após a seleção da conta
        const passwordResponse = await inquirer.prompt([
            {
                name: 'senha',
                message: 'Insira sua senha: ',
            },
        ]);

        // Verificação da senha
        if (login(response.accountName, passwordResponse.senha)) {
            return response.accountName; // Retorna o nome da conta se a senha estiver correta
        } else {
            console.log(chalk.bgRed.black('Senha incorreta!!!'));
            return operation(); // Retorna null se a senha estiver incorreta
        }
    } catch (err) {
        console.log(chalk.bgRed('Erro ao selecionar a conta.'), err);
        return null; // Retorna null em caso de erro
    }
}

function updateBalance(accountName, amount, choice) {
    if(choice === "deposit") {
        const userAccount = getAccount(accountName)

        if(!amount) {
            console.log(chalk.bgRed.black('Ocorreu um erro, tente novamente'))
            return deposit()
        }

        userAccount.balance += parseFloat(amount)
        fs.writeFileSync(
            `users/${accountName}.json`,
            JSON.stringify(userAccount),
            (err) => {
                console.log(err)
            }
        )
        console.log(chalk.green(`Foi depositado um valor de R$${amount} em sua conta`))
    } else if(choice === "withdraw") {
        const userAccount = getAccount(accountName)

        if(!amount) {
            console.log(chalk.bgRed.black('Ocorreu um erro, tente novamente'))
            return deposit()
        }

        if(userAccount.balance > parseFloat(amount)) {
            userAccount.balance -= parseFloat(amount)
            fs.writeFileSync(
                `users/${accountName}.json`,
                JSON.stringify(userAccount),
                (err) => {
                    console.log(err)
                }
            )
            console.log(chalk.green(`Foi retirado um valor de R$${amount} em sua conta`))
        } else {
            console.log(chalk.bgRed.black(`Não foi possivel realizar o saque, saldo atual: R$${userAccount.balance}`))
        }
    }
}

function getAccount(accountName) {
    const accountJson = fs.readFileSync(`users/${accountName}.json`, {
        encoding: 'utf8',
        flag: 'r',
    })

    return JSON.parse(accountJson)
}

//* Show account balance
async function getBalance() {
    const accountName = await listAccounts()
    if(accountName) {
        const userAccount = getAccount(accountName)
        console.log(chalk.bgBlue.black(`Olá ${accountName}, seu saldo é de ${userAccount.balance}`))
        operation()
    }
}

//* Withdraw
async function withdraw() {
    const accountName = await listAccounts()

    if(accountName) {
        inquirer.prompt([
            {
                name: "amount",
                message: "Quanto deseja sacar: "
            }
        ])
        .then((ans) => {
            const amount = ans['amount']
            updateBalance(accountName, amount, 'withdraw')
            operation()
        })
        .catch(err => {
            console.log(err)
        })
    }
}

//* Login
// Ajuste na função login para retornar booleano ao invés de "yes" ou "no"
function login(accountName, password) {
    const userAccount = getAccount(accountName);
    return password == userAccount.password;
}

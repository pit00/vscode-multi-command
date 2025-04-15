import * as vscode from "vscode";

const vscodeVariables = require('vscode-variables');

export class Command {
    constructor(
        private readonly exe: string,
        private readonly args: object | undefined,
        private readonly repeat: number,
        private readonly onSuccess: Array<Command> | undefined,
        private readonly onFail: Array<Command> | undefined,
        private readonly variableSubstitution: boolean
    ) {}

    public async execute() {
        try {
            if (this.args) {
                let args;
                if (this.variableSubstitution) {
                    args = this.substituteVariables(this.args);
                } else {
                    args = this.args;
                }
                let rep = this.repeat;
                
                if(rep == 0) // manual loop
                    if(vscode.window.activeTextEditor?.selections.length !== undefined)
                        rep = vscode.window.activeTextEditor?.selections.length
                
                if(rep == -1){ // auto loop
                    if(vscode.window.activeTextEditor?.selections.length !== undefined){
                        rep = vscode.window.activeTextEditor?.selections.length
                        
                        await vscode.commands.executeCommand("multiple-cursor-pattern.OrderMult")
                        for(let i = 0; i < rep; i++) {
                            await vscode.commands.executeCommand(this.exe, args); // Cmds
                            await vscode.commands.executeCommand("custom.RemoveFirstCursor")
                        }
                        await vscode.commands.executeCommand("cursorLineEnd")
                        await vscode.commands.executeCommand("cancelSelection")
                    }
                }else{
                    for(let i = 0; i < rep; i++) {
                        await vscode.commands.executeCommand(this.exe, args);
                    }
                }
            } else {
                let rep = this.repeat;
                
                if(rep == 0) // manual loop (may not work)
                    if(vscode.window.activeTextEditor?.selections.length !== undefined)
                        rep = vscode.window.activeTextEditor?.selections.length
                
                if(rep == -1){ // auto loop
                    if(vscode.window.activeTextEditor?.selections.length !== undefined){
                        rep = vscode.window.activeTextEditor?.selections.length
                        await vscode.commands.executeCommand("multiple-cursor-pattern.OrderMult")
                        for(let i = 0; i < rep; i++) {
                            await vscode.commands.executeCommand(this.exe); // Cmd
                            await vscode.commands.executeCommand("custom.RemoveFirstCursor")
                        }
                        await vscode.commands.executeCommand("cursorLineEnd")
                        await vscode.commands.executeCommand("cancelSelection")
                    }
                }else{
                    for(let i = 0; i < rep; i++) {
                        await vscode.commands.executeCommand(this.exe);
                    }
                }
            }
            if (this.onSuccess) {
                for (let command of this.onSuccess) {
                    await command.execute();
                }
            }
        } catch(e) {
            if (this.onFail) {
                for (let command of this.onFail) {
                    await command.execute();
                }
            } else {
                throw(e);
            }
        }
    }

    private substituteVariables(args: any ): any {
        if (typeof args === 'string') {
            args = args.replace(/\${userHome}/g, process.env['HOME'] || '');
            return vscodeVariables(args);
        } else if (typeof args === 'object') {
            let rt: any = {};
            for(const key of Object.keys(args)) {
                rt[key] = this.substituteVariables(args[key]);
            }
            return rt;
        } else {
            return args;
        }
    }
    
}

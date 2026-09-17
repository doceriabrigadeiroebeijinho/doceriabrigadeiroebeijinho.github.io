# Integração gratuita com Google Sheets, Agenda e comandas em PDF

1. Abra a planilha de clientes e pedidos e escolha **Extensões → Apps Script**.
2. Substitua o conteúdo de `Code.gs` pelo arquivo desta pasta.
3. Em **Configurações do projeto → Propriedades do script**, crie `SITE_SECRET` com uma senha longa e exclusiva.
4. Em **Implantar → Nova implantação → Aplicativo da Web**, execute como a proprietária e permita acesso a qualquer pessoa com o link.
5. Guarde a URL da implantação e a senha. Configure-as no site como `GOOGLE_APPS_SCRIPT_URL` e `GOOGLE_APPS_SCRIPT_SECRET`.
6. Na primeira execução da nova versão, autorize o acesso ao Google Drive e ao Google Docs quando o Google solicitar. O script criará automaticamente a pasta **Comandas - Doceria Brigadeiro & Beijinho** no Google Drive.

O mesmo aplicativo recebe os pedidos, atualiza as abas `Pedidos` e `Clientes`, cria o compromisso no Google Agenda e gera uma comanda em PDF para cada pedido. A aba `Pedidos` passa a ter a coluna `Comanda PDF`, com um link direto para abrir o arquivo e imprimir.

// 🧪 TESTE DE EXCLUSÃO NO CONSOLE DO NAVEGADOR

// PASSO 1: Abra o KazuFlow no navegador
// PASSO 2: Pressione F12 para abrir DevTools
// PASSO 3: Vá na aba "Console"
// PASSO 4: Cole e execute cada comando abaixo

// 1. Verificar se o Supabase está disponível
console.log('Supabase disponível:', typeof supabase !== 'undefined');

// 2. Listar quadros existentes
supabase
  .from('trello_boards')
  .select('id, title, is_deleted')
  .eq('is_deleted', false)
  .limit(5)
  .then(result => {
    console.log('📋 Quadros disponíveis:', result.data);
    if (result.data && result.data.length > 0) {
      console.log('🎯 Para testar, use um destes IDs:', result.data.map(b => b.id));
    }
  })
  .catch(error => console.error('❌ Erro ao listar quadros:', error));

// 3. Testar função de exclusão (SUBSTITUA O ID)
// IMPORTANTE: Substitua 'SEU_BOARD_ID_AQUI' por um ID real da lista acima
const testBoardId = 'SEU_BOARD_ID_AQUI'; // ⚠️ SUBSTITUA ESTE ID

console.log('🧪 Testando exclusão do quadro:', testBoardId);

supabase.rpc('emergency_delete_board', { board_id: testBoardId })
  .then(result => {
    console.log('✅ Resultado da exclusão:', result);
    if (result.data === true) {
      console.log('🎉 EXCLUSÃO FUNCIONOU!');
    } else {
      console.log('❌ Exclusão falhou - resultado:', result.data);
    }
  })
  .catch(error => {
    console.error('💥 Erro na exclusão:', error);
    
    // Tentar método alternativo
    console.log('🔄 Tentando método alternativo...');
    supabase
      .from('trello_boards')
      .update({ is_deleted: true })
      .eq('id', testBoardId)
      .then(altResult => {
        console.log('✅ Método alternativo resultado:', altResult);
        if (!altResult.error) {
          console.log('🎉 MÉTODO ALTERNATIVO FUNCIONOU!');
        }
      })
      .catch(altError => console.error('💥 Método alternativo falhou:', altError));
  });

// 4. Verificar se o quadro foi excluído
setTimeout(() => {
  supabase
    .from('trello_boards')
    .select('id, title, is_deleted')
    .eq('id', testBoardId)
    .single()
    .then(result => {
      console.log('🔍 Status do quadro após exclusão:', result.data);
      if (result.data && result.data.is_deleted === true) {
        console.log('✅ QUADRO FOI MARCADO COMO EXCLUÍDO!');
      } else {
        console.log('❌ Quadro NÃO foi marcado como excluído');
      }
    })
    .catch(error => console.error('❌ Erro ao verificar status:', error));
}, 2000);

// 5. Função de teste completa (execute depois de substituir o ID)
function testarExclusaoCompleta(boardId) {
  console.log('🚀 INICIANDO TESTE COMPLETO DE EXCLUSÃO');
  console.log('📋 ID do quadro:', boardId);
  
  // Confirmar exclusão
  if (!confirm(`Tem certeza que quer excluir o quadro ${boardId}?`)) {
    console.log('❌ Teste cancelado');
    return;
  }
  
  // Executar exclusão
  supabase.rpc('emergency_delete_board', { board_id: boardId })
    .then(result => {
      console.log('📊 Resultado:', result);
      if (result.data === true) {
        console.log('🎉 SUCESSO! Recarregando página...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        console.log('❌ Falhou:', result);
      }
    })
    .catch(error => {
      console.error('💥 Erro:', error);
    });
}

// INSTRUÇÕES:
// 1. Execute os comandos 1 e 2 primeiro
// 2. Copie um ID da lista de quadros
// 3. Substitua 'SEU_BOARD_ID_AQUI' pelo ID real
// 4. Execute o comando 3
// 5. Ou use: testarExclusaoCompleta('ID_REAL_AQUI')

console.log('🎯 TESTE PRONTO! Siga as instruções acima.');
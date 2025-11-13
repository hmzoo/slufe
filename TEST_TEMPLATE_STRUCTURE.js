/**
 * Examine la structure réelle des templates reçus du backend
 */

// Test: Appeler le backend et voir la structure
async function testTemplateStructure() {
  try {
    const response = await fetch('http://localhost:3000/api/templates')
    const data = await response.json()
    
    console.log('📋 Templates reçus:', data.length)
    
    if (data.length > 0) {
      const template = data[0]
      console.log('\n🔍 Première template:')
      console.log('  id:', template.id)
      console.log('  name:', template.name)
      console.log('  workflow:', typeof template.workflow)
      
      if (template.workflow) {
        console.log('\n  workflow.inputs:', Array.isArray(template.workflow.inputs) ? 'ARRAY' : typeof template.workflow.inputs)
        if (Array.isArray(template.workflow.inputs)) {
          console.log('    Count:', template.workflow.inputs.length)
          console.log('    [0]:', JSON.stringify(template.workflow.inputs[0], null, 2))
        } else {
          console.log('    ', JSON.stringify(template.workflow.inputs, null, 2))
        }
        
        console.log('\n  workflow.tasks:', Array.isArray(template.workflow.tasks) ? 'ARRAY' : typeof template.workflow.tasks)
        if (Array.isArray(template.workflow.tasks)) {
          console.log('    Count:', template.workflow.tasks.length)
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

testTemplateStructure()

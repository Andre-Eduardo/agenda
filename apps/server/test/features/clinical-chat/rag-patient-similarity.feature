@real-api
Feature: Busca vetorial retorna chunks semanticamente relevantes

    Background:
        Given um profissional logado com especialidade "MEDICINA"

    Scenario: Query sobre glicemia recupera chunk de diabetes
        Given um paciente "João" com evolução "Paciente com glicemia de 180 mg/dL em jejum"
        And os chunks do paciente foram indexados
        When consulto chunks com query "diabetes açúcar elevado"
        Then o primeiro chunk tem score > 0.7
        And o primeiro chunk contém "glicemia"

    Scenario: Isolamento por paciente
        Given um paciente "João" com evolução "hipertensão arterial"
        And um paciente "Maria" com evolução "asma brônquica"
        When consulto chunks do paciente "João" com query "doença respiratória"
        Then nenhum chunk retornado menciona "asma"

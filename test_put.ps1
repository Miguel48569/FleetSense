$url = "https://fleetcontrolbackend.onrender.com"
$m = (Invoke-RestMethod "$url/motoristas").data[0]
$cpf = $m.cpf
# Tentar CPF sem pontos e traço como ID na URL
$cpfID = $cpf -replace '\.', '' -replace '-', ''
$origNome = $m.nome

Write-Host "Testando com CPF ID na URL: $cpfID"

function Test-Variant($variant, $body) {
    try {
        $json = $body | ConvertTo-Json
        $r = Invoke-WebRequest -Uri "$url/motoristas/$cpfID" -Method Put -Body $json -ContentType "application/json" -ErrorAction Stop
        $check = (Invoke-RestMethod -Uri "$url/motoristas").data | Where-Object { $_.cpf -eq $cpf }
        $persisted = if ($check.nome -match "V\d") { "Sim" } else { "Não" }
        return [PSCustomObject]@{ Variante=$variant; Status=$r.StatusCode; Persistiu=$persisted }
    } catch {
        return [PSCustomObject]@{ Variante=$variant; Status="Erro $($_.Exception.Message)"; Persistiu="Não" }
    }
}

$results = @()
$results += Test-Variant "V1" @{ cpf=$cpf; nome="$origNome V1"; cnh=$m.cnh; data_nasc=$m.data_nasc; data_adm=$m.data_adm; data_dem=$m.data_dem; email=$m.email }
$results += Test-Variant "V2" @{ cpf=$cpf; nome="$origNome V2"; cnh=$m.cnh; data_nasc=$m.data_nasc; data_adm=($m.data_adm -replace " ", "T"); data_dem=($m.data_dem -replace " ", "T"); email=$m.email }
$results += Test-Variant "V3" @{ cpf=$cpf; nome="$origNome V3"; cnh=$m.cnh; data_nasc=$m.data_nasc; data_adm=($m.data_adm -replace " ", "T"); data_dem=($m.data_dem -replace " ", "T"); email=$m.email; status="inativo" }
$results += Test-Variant "V4" @{ id=$cpf; name="$origNome V4"; cpf=$cpf; nome="$origNome V4"; cnh=$m.cnh; data_nasc=$m.data_nasc; data_adm=($m.data_adm -replace " ", "T"); data_dem=($m.data_dem -replace " ", "T"); email=$m.email; status="inativo" }

$results | Format-Table -AutoSize

# Restore
Invoke-RestMethod -Uri "$url/motoristas/$cpfID" -Method Put -Body (@{ cpf=$cpf; nome=$origNome; cnh=$m.cnh; data_nasc=$m.data_nasc; data_adm=$m.data_adm; data_dem=$m.data_dem; email=$m.email } | ConvertTo-Json) -ContentType "application/json" -ErrorAction SilentlyContinue

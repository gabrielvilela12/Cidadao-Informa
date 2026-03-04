using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Zeladoria.Application.Interfaces;
using Zeladoria.Application.UseCases.Auth;
using Zeladoria.Application.UseCases.Protocols;
using Zeladoria.Domain.Interfaces;
using Zeladoria.Infrastructure.Repositories;
using Zeladoria.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger with JWT Support
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configure JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "SuperSecretKeyForZeladoriaApplication2026";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "Bearer";
    options.DefaultChallengeScheme = "Bearer";
}).AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Set to true in prod
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSecret)),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

// Configure Entity Framework Core with PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
builder.Services.AddDbContext<Zeladoria.Infrastructure.Data.ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// Dependency Injection
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProtocolRepository, ProtocolRepository>();
builder.Services.AddScoped<IJwtService, JwtService>();

builder.Services.AddScoped<CreateProtocolUseCase>();
builder.Services.AddScoped<GetProtocolsUseCase>();
builder.Services.AddScoped<LoginUseCase>();
builder.Services.AddScoped<RegisterUseCase>();
builder.Services.AddScoped<GetMeUseCase>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        b => b.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll"); // CORS deve vir antes de qualquer redirecionamento

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

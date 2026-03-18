using System;
using System.Security.Cryptography;

namespace CidadaoInforma.Application.Utils;

public static class AuthUtils
{
    private const int Pbkdf2IterCount = 10000;
    private const int Pbkdf2SubkeyLength = 256 / 8;
    private const int SaltSize = 128 / 8;

    public static string HashPassword(string password)
    {
        byte[] salt = new byte[SaltSize];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(salt);
        }

        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Pbkdf2IterCount,
            HashAlgorithmName.SHA256,
            Pbkdf2SubkeyLength);

        byte[] hashBytes = new byte[SaltSize + Pbkdf2SubkeyLength];
        Array.Copy(salt, 0, hashBytes, 0, SaltSize);
        Array.Copy(hash, 0, hashBytes, SaltSize, Pbkdf2SubkeyLength);

        return Convert.ToBase64String(hashBytes);
    }

    public static bool VerifyPassword(string password, string hashedPassword)
    {
        try
        {
            byte[] hashBytes = Convert.FromBase64String(hashedPassword);
            byte[] salt = new byte[SaltSize];
            Array.Copy(hashBytes, 0, salt, 0, SaltSize);

            byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                Pbkdf2IterCount,
                HashAlgorithmName.SHA256,
                Pbkdf2SubkeyLength);

            for (int i = 0; i < Pbkdf2SubkeyLength; i++)
            {
                if (hashBytes[i + SaltSize] != hash[i])
                    return false;
            }
            return true;
        }
        catch
        {
            return false;
        }
    }
}

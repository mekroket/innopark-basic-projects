using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance;

    public bool hasKeyCard = false;

    private UIManager uiManager;

    private void Awake()
    {
        Instance = this;
    }

    private void Start()
    {
        uiManager = FindObjectOfType<UIManager>();
    }

    public void CollectKeyCard()
    {
        hasKeyCard = true;

        if (uiManager != null)
        {
            uiManager.ShowCardCollectedMessage();
        }

        Debug.Log("Kart alındı. Çıkış aktif.");
    }

    public void WinGame()
    {
        if (uiManager != null)
        {
            uiManager.ShowWinMessage();
        }

        Debug.Log("OYUN BİTTİ: Çıkış bulundu.");
    }
}
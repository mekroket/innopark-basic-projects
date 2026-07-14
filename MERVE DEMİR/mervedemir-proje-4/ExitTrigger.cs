using UnityEngine;

public class ExitTrigger : MonoBehaviour
{
    public float exitDistance = 4f;

    private Transform player;
    private bool exitDone = false;

    void Start()
    {
        GameObject playerObj = GameObject.FindWithTag("Player");

        if (playerObj != null)
        {
            player = playerObj.transform;
        }
        else
        {
            Debug.LogError("Player bulunamadı. Player Tag kesinlikle Player olmalı.");
        }
    }

    void Update()
    {
        if (exitDone)
            return;

        if (player == null)
            return;

        float distance = Vector3.Distance(transform.position, player.position);

        if (distance <= exitDistance)
        {
            TryExit();
        }
    }

    void TryExit()
    {
        if (GameManager.Instance == null)
        {
            Debug.LogError("GameManager sahnede yok.");
            return;
        }

        if (GameManager.Instance.hasKeyCard)
        {
            exitDone = true;
            GameManager.Instance.WinGame();
        }
        else
        {
            Debug.Log("Önce çıkış kartını bulmalısın.");
        }
    }
}
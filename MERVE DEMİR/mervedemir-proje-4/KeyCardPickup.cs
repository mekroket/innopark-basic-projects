using UnityEngine;

public class KeyCardPickup : MonoBehaviour
{
    public float pickupDistance = 2.2f;

    private Transform player;
    private bool pickedUp = false;

    private void Start()
    {
        GameObject playerObj = GameObject.FindWithTag("Player");

        if (playerObj != null)
        {
            player = playerObj.transform;
        }
        else
        {
            Debug.LogError("Player tag bulunamadı. Player objesinin Tag kısmı Player olmalı.");
        }
    }

    private void Update()
    {
        if (pickedUp)
            return;

        if (player == null)
            return;

        float distance = Vector3.Distance(transform.position, player.position);

        if (distance <= pickupDistance)
        {
            PickUpCard();
        }
    }

    private void PickUpCard()
    {
        pickedUp = true;

        if (GameManager.Instance != null)
        {
            GameManager.Instance.CollectKeyCard();
        }

        Debug.Log("Kart alındı.");

        gameObject.SetActive(false);
    }
}